package com.abhinav.linkedin.posts_service.service;

import com.abhinav.linkedin.posts_service.client.ConnectionClient;
import com.abhinav.linkedin.posts_service.dto.*;
import com.abhinav.linkedin.posts_service.entity.Poll;
import com.abhinav.linkedin.posts_service.entity.PollOption;
import com.abhinav.linkedin.posts_service.entity.PollVote;
import com.abhinav.linkedin.posts_service.entity.Post;
import com.abhinav.linkedin.posts_service.entity.PostBookmark;
import com.abhinav.linkedin.posts_service.entity.PostImage;
import com.abhinav.linkedin.posts_service.event.PostCreatedEvent;
import com.abhinav.linkedin.posts_service.exception.BadRequestException;
import com.abhinav.linkedin.posts_service.exception.ForbiddenException;
import com.abhinav.linkedin.posts_service.exception.ResourceNotFoundException;
import com.abhinav.linkedin.posts_service.repository.CommentRepository;
import com.abhinav.linkedin.posts_service.repository.PollRepository;
import com.abhinav.linkedin.posts_service.repository.PollVoteRepository;
import com.abhinav.linkedin.posts_service.repository.PostBookmarkRepository;
import com.abhinav.linkedin.posts_service.repository.PostImageRepository;
import com.abhinav.linkedin.posts_service.repository.PostLikeRepository;
import com.abhinav.linkedin.posts_service.repository.PostRepository;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PostService {

    private final PostRepository postRepository;
    private final PostLikeRepository postLikeRepository;
    private final CommentRepository commentRepository;
    private final PostBookmarkRepository postBookmarkRepository;
    private final PollRepository pollRepository;
    private final PollVoteRepository pollVoteRepository;
    private final ConnectionClient connectionClient;
    private final ModelMapper modelMapper;
    private final KafkaTemplate<Long, PostCreatedEvent> kafkaTemplate;

    @Value("${app.kafka.topics.post-created:post-created-topic}")
    private String postCreatedTopic;

    @Transactional
    @CacheEvict(value = "userFeed", allEntries = true)
    public PostDto createPost(PostCreateRequestDto postDto, Long userId) {
        log.info("Creating post for user: {}", userId);
        Post post = new Post();
        post.setContent(postDto.getContent());
        post.setUserId(userId);

        // Extract all media URLs from any provided field (images, mediaUrls, mediaUrl)
        List<String> rawUrls = new ArrayList<>();
        if (postDto.getImages() != null && !postDto.getImages().isEmpty()) {
            for (String u : postDto.getImages()) {
                if (u != null && !u.isBlank() && !rawUrls.contains(u.trim())) {
                    rawUrls.add(u.trim());
                }
            }
        }
        if (postDto.getMediaUrls() != null && !postDto.getMediaUrls().isEmpty()) {
            for (String u : postDto.getMediaUrls()) {
                if (u != null && !u.isBlank() && !rawUrls.contains(u.trim())) {
                    rawUrls.add(u.trim());
                }
            }
        }
        if (rawUrls.isEmpty() && postDto.getMediaUrl() != null && !postDto.getMediaUrl().isBlank()) {
            rawUrls.add(postDto.getMediaUrl().trim());
        }

        List<PostImage> postImages = new ArrayList<>();
        int order = 0;
        for (String url : rawUrls) {
            postImages.add(PostImage.builder()
                    .post(post)
                    .imageUrl(url)
                    .displayOrder(order++)
                    .build());
        }
        post.setImages(postImages);
        if (!rawUrls.isEmpty()) {
            post.setMediaUrl(rawUrls.get(0));
        }

        // Handle Quote Repost if provided
        if (postDto.getRepostOfPostId() != null) {
            postRepository.findById(postDto.getRepostOfPostId()).ifPresent(origPost -> {
                post.setRepostOfPostId(origPost.getId());
                log.info("Post is a quote repost of postId: {}", origPost.getId());
            });
        }

        Post savedPost = postRepository.save(post);

        // Handle Poll attachment if provided
        if (postDto.getPoll() != null && postDto.getPoll().getQuestion() != null && !postDto.getPoll().getQuestion().isBlank()) {
            PollCreateRequestDto pollReq = postDto.getPoll();
            Poll poll = Poll.builder()
                    .post(savedPost)
                    .question(pollReq.getQuestion().trim())
                    .build();

            List<PollOption> options = new ArrayList<>();
            if (pollReq.getOptions() != null) {
                for (String optText : pollReq.getOptions()) {
                    if (optText != null && !optText.isBlank()) {
                        options.add(PollOption.builder()
                                .poll(poll)
                                .optionText(optText.trim())
                                .votesCount(0)
                                .build());
                    }
                }
            }
            if (options.size() >= 2) {
                poll.setOptions(options);
                pollRepository.save(poll);
                savedPost.setPoll(poll);
            }
        }

        PostCreatedEvent postCreatedEvent = PostCreatedEvent.builder()
                .postId(savedPost.getId())
                .creatorId(userId)
                .content(postDto.getContent())
                .build();

        try {
            kafkaTemplate.send(postCreatedTopic, savedPost.getId(), postCreatedEvent);
            log.info("Published PostCreatedEvent to Kafka topic: {} for postId: {}", postCreatedTopic, savedPost.getId());
        } catch (Exception e) {
            log.error("Failed to publish PostCreatedEvent to Kafka: {}", e.getMessage(), e);
        }

        return mapToDtoWithPoll(savedPost, userId);
    }

    public PostDto getPostById(Long id, Long currentUserId) {
        log.debug("Retrieving post by id {} for user {}", id, currentUserId);

        Post post = postRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with id: " + id));

        return mapToDtoWithPoll(post, currentUserId);
    }

    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "posts", key = "#postId"),
            @CacheEvict(value = "userFeed", allEntries = true)
    })
    public PostDto updatePost(Long postId, PostCreateRequestDto updateDto, Long currentUserId) {
        log.info("Updating post {} by user {}", postId, currentUserId);

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with id: " + postId));

        if (!post.getUserId().equals(currentUserId)) {
            log.warn("User {} attempted to update post {} owned by user {}", currentUserId, postId, post.getUserId());
            throw new ForbiddenException("You are not authorized to update this post");
        }

        if (updateDto.getContent() != null) {
            post.setContent(updateDto.getContent());
        }
        List<String> updatedRawUrls = new ArrayList<>();
        if (updateDto.getImages() != null && !updateDto.getImages().isEmpty()) {
            for (String u : updateDto.getImages()) {
                if (u != null && !u.isBlank() && !updatedRawUrls.contains(u.trim())) {
                    updatedRawUrls.add(u.trim());
                }
            }
        }
        if (updateDto.getMediaUrls() != null && !updateDto.getMediaUrls().isEmpty()) {
            for (String u : updateDto.getMediaUrls()) {
                if (u != null && !u.isBlank() && !updatedRawUrls.contains(u.trim())) {
                    updatedRawUrls.add(u.trim());
                }
            }
        }
        if (updatedRawUrls.isEmpty() && updateDto.getMediaUrl() != null && !updateDto.getMediaUrl().isBlank()) {
            updatedRawUrls.add(updateDto.getMediaUrl().trim());
        }

        // Cleanly clear existing images before adding new ones
        if (post.getImages() == null) {
            post.setImages(new ArrayList<>());
        } else {
            post.getImages().clear();
        }

        try {
            postRepository.deleteLegacyPostMediaUrls(postId);
        } catch (Exception ignored) {
        }

        int order = 0;
        for (String url : updatedRawUrls) {
            post.getImages().add(PostImage.builder()
                    .post(post)
                    .imageUrl(url)
                    .displayOrder(order++)
                    .build());
        }
        if (!updatedRawUrls.isEmpty()) {
            post.setMediaUrl(updatedRawUrls.get(0));
        } else {
            post.setMediaUrl(null);
        }
        Post updatedPost = postRepository.save(post);
        return mapToDtoWithPoll(updatedPost, currentUserId);
    }

    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "posts", key = "#postId"),
            @CacheEvict(value = "userFeed", allEntries = true)
    })
    public void deletePost(Long postId, Long currentUserId) {
        log.info("Deleting post {} by user {}", postId, currentUserId);

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with id: " + postId));

        if (!post.getUserId().equals(currentUserId)) {
            log.warn("User {} attempted to delete post {} owned by user {}", currentUserId, postId, post.getUserId());
            throw new ForbiddenException("You are not authorized to delete this post");
        }

        // 1. Break any quote repost references pointing to this post
        try {
            postRepository.nullifyRepostOfPostId(postId);
        } catch (Exception e) {
            log.warn("Error nullifying quote reposts for postId {}: {}", postId, e.getMessage());
        }

        // 2. Delete poll and poll votes if present
        Optional<Poll> pollOpt = pollRepository.findByPostId(postId);
        pollOpt.ifPresent(poll -> {
            try {
                pollVoteRepository.deleteByPollId(poll.getId());
            } catch (Exception e) {
                log.warn("Error deleting poll votes for pollId {}: {}", poll.getId(), e.getMessage());
            }
            try {
                pollRepository.delete(poll);
            } catch (Exception e) {
                log.warn("Error deleting poll for postId {}: {}", postId, e.getMessage());
            }
        });
        post.setPoll(null);

        // 3. Delete legacy post_media_urls, child images, comments, bookmarks, and likes
        try {
            postRepository.deleteLegacyPostMediaUrls(postId);
        } catch (Exception e) {
            log.warn("Error deleting legacy media urls for postId {}: {}", postId, e.getMessage());
        }

        try {
            postImageRepository.deleteByPostId(postId);
        } catch (Exception e) {
            log.warn("Error deleting images for postId {}: {}", postId, e.getMessage());
        }
        if (post.getImages() != null) {
            post.getImages().clear();
        }

        try {
            commentRepository.deleteByPostId(postId);
        } catch (Exception e) {
            log.warn("Error deleting comments for postId {}: {}", postId, e.getMessage());
        }

        try {
            postBookmarkRepository.deleteByPostId(postId);
        } catch (Exception e) {
            log.warn("Error deleting bookmarks for postId {}: {}", postId, e.getMessage());
        }

        try {
            postLikeRepository.deleteByPostId(postId);
        } catch (Exception e) {
            log.warn("Error deleting likes for postId {}: {}", postId, e.getMessage());
        }

        // 4. Delete the post and flush
        postRepository.delete(post);
        postRepository.flush();
        log.info("Successfully deleted post {}", postId);
    }

    public List<PostDto> getAllPostsofUsers(Long targetUserId, Long currentUserId) {
        log.debug("Retrieving posts by user id {} requested by {}", targetUserId, currentUserId);

        List<Post> posts = postRepository.findByUserId(targetUserId);
        return posts.stream()
                .map(p -> mapToDtoWithPoll(p, currentUserId))
                .collect(Collectors.toList());
    }

    @Cacheable(value = "userFeed", key = "#currentUserId")
    @CircuitBreaker(name = "connectionService", fallbackMethod = "getFeedFallback")
    public List<PostDto> getFeed(Long currentUserId) {
        log.debug("Retrieving dynamic feed for user: {}", currentUserId);
        List<Post> allPosts = postRepository.findAllByOrderByCreatedAtDesc();

        if (allPosts.isEmpty()) {
            return Collections.emptyList();
        }

        Set<Long> priorityAuthorIds = new HashSet<>();
        if (currentUserId != null) {
            priorityAuthorIds.add(currentUserId);
            try {
                List<PersonDto> connections = connectionClient.getFirstDegreeConnections(currentUserId);
                if (connections != null) {
                    for (PersonDto p : connections) {
                        if (p.getUserId() != null) {
                            priorityAuthorIds.add(p.getUserId());
                        }
                    }
                }
            } catch (Exception e) {
                log.warn("Could not fetch connection IDs for feed ranking: {}", e.getMessage());
            }
        }

        List<Post> priorityPosts = new ArrayList<>();
        List<Post> communityPosts = new ArrayList<>();

        for (Post post : allPosts) {
            if (priorityAuthorIds.contains(post.getUserId())) {
                priorityPosts.add(post);
            } else {
                communityPosts.add(post);
            }
        }

        List<Post> rankedPosts = new ArrayList<>(priorityPosts);
        rankedPosts.addAll(communityPosts);

        return rankedPosts.stream()
                .map(p -> mapToDtoWithPoll(p, currentUserId))
                .collect(Collectors.toList());
    }

    public List<PostDto> getFeedFallback(Long currentUserId, Throwable throwable) {
        log.warn("Circuit breaker fallback triggered for getFeed({}). Remote connection-service unavailable: {}",
                currentUserId, throwable.getMessage());
        List<Post> allPosts = postRepository.findAllByOrderByCreatedAtDesc();
        return allPosts.stream()
                .map(p -> mapToDtoWithPoll(p, currentUserId))
                .collect(Collectors.toList());
    }

    @Transactional
    public boolean toggleBookmark(Long postId, Long currentUserId) {
        log.info("Toggling bookmark on post {} for user {}", postId, currentUserId);
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with id: " + postId));

        Optional<PostBookmark> existing = postBookmarkRepository.findByUserIdAndPostId(currentUserId, postId);
        if (existing.isPresent()) {
            postBookmarkRepository.deleteByUserIdAndPostId(currentUserId, postId);
            log.info("Removed bookmark for post {} by user {}", postId, currentUserId);
            return false;
        } else {
            PostBookmark bookmark = PostBookmark.builder()
                    .userId(currentUserId)
                    .post(post)
                    .build();
            postBookmarkRepository.save(bookmark);
            log.info("Saved bookmark for post {} by user {}", postId, currentUserId);
            return true;
        }
    }

    public boolean isPostBookmarked(Long postId, Long currentUserId) {
        if (currentUserId == null || postId == null) return false;
        return postBookmarkRepository.existsByUserIdAndPostId(currentUserId, postId);
    }

    public List<PostDto> getBookmarkedPosts(Long currentUserId) {
        log.debug("Retrieving bookmarked posts for user: {}", currentUserId);
        List<PostBookmark> bookmarks = postBookmarkRepository.findByUserIdWithPost(currentUserId);
        return bookmarks.stream()
                .map(b -> mapToDtoWithPoll(b.getPost(), currentUserId))
                .collect(Collectors.toList());
    }

    @Transactional
    public PollDto votePoll(Long pollId, Long optionId, Long currentUserId) {
        log.info("User {} casting vote for option {} on poll {}", currentUserId, optionId, pollId);
        Poll poll = pollRepository.findById(pollId)
                .orElseThrow(() -> new ResourceNotFoundException("Poll not found with id: " + pollId));

        if (pollVoteRepository.existsByPollIdAndUserId(pollId, currentUserId)) {
            throw new BadRequestException("You have already voted on this poll");
        }

        PollOption selectedOption = poll.getOptions().stream()
                .filter(opt -> opt.getId().equals(optionId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Option not found with id: " + optionId));

        selectedOption.setVotesCount(selectedOption.getVotesCount() + 1);

        PollVote vote = PollVote.builder()
                .pollId(pollId)
                .optionId(optionId)
                .userId(currentUserId)
                .build();
        pollVoteRepository.save(vote);

        return buildPollDto(poll, currentUserId);
    }

    public PollDto getPollByPostId(Long postId, Long currentUserId) {
        Poll poll = pollRepository.findByPostId(postId)
                .orElseThrow(() -> new ResourceNotFoundException("No poll found for post id: " + postId));
        return buildPollDto(poll, currentUserId);
    }

    private PostDto mapToDtoWithPoll(Post post, Long currentUserId) {
        PostDto dto = modelMapper.map(post, PostDto.class);

        // Collect all images from PostImage entity first, with mediaUrl as fallback
        List<String> imageUrls = new ArrayList<>();
        if (post.getImages() != null && !post.getImages().isEmpty()) {
            for (PostImage img : post.getImages()) {
                if (img != null && img.getImageUrl() != null && !img.getImageUrl().isBlank()) {
                    imageUrls.add(img.getImageUrl().trim());
                }
            }
        } else if (post.getMediaUrl() != null && !post.getMediaUrl().isBlank()) {
            imageUrls.add(post.getMediaUrl().trim());
        }

        dto.setImages(new ArrayList<>(imageUrls));
        dto.setMediaUrls(new ArrayList<>(imageUrls));
        dto.setMediaUrl(imageUrls.isEmpty() ? null : imageUrls.get(0));

        // Populate Reposted Post if this is a quote/repost
        if (post.getRepostOfPostId() != null) {
            postRepository.findById(post.getRepostOfPostId()).ifPresent(origPost -> {
                PostDto origDto = modelMapper.map(origPost, PostDto.class);
                List<String> origImages = new ArrayList<>();
                if (origPost.getImages() != null && !origPost.getImages().isEmpty()) {
                    for (PostImage img : origPost.getImages()) {
                        if (img != null && img.getImageUrl() != null && !img.getImageUrl().isBlank()) {
                            origImages.add(img.getImageUrl().trim());
                        }
                    }
                } else if (origPost.getMediaUrl() != null && !origPost.getMediaUrl().isBlank()) {
                    origImages.add(origPost.getMediaUrl().trim());
                }
                origDto.setImages(new ArrayList<>(origImages));
                origDto.setMediaUrls(new ArrayList<>(origImages));
                origDto.setMediaUrl(origImages.isEmpty() ? null : origImages.get(0));

                Optional<Poll> origPollOpt = pollRepository.findByPostId(origPost.getId());
                origPollOpt.ifPresent(p -> origDto.setPoll(buildPollDto(p, currentUserId)));
                dto.setRepostedPost(origDto);
            });
        }

        Optional<Poll> pollOpt = pollRepository.findByPostId(post.getId());
        pollOpt.ifPresent(poll -> dto.setPoll(buildPollDto(poll, currentUserId)));

        dto.setLikesCount((int) postLikeRepository.countByPostId(post.getId()));
        if (currentUserId != null) {
            dto.setHasLiked(postLikeRepository.existsByPostIdAndUserId(post.getId(), currentUserId));
        }
        dto.setCommentsCount((int) commentRepository.countByPostId(post.getId()));

        return dto;
    }

    private PollDto buildPollDto(Poll poll, Long currentUserId) {
        int totalVotes = poll.getOptions().stream()
                .mapToInt(PollOption::getVotesCount)
                .sum();

        Long votedOptionId = null;
        boolean hasVoted = false;

        if (currentUserId != null) {
            Optional<PollVote> voteOpt = pollVoteRepository.findByPollIdAndUserId(poll.getId(), currentUserId);
            if (voteOpt.isPresent()) {
                votedOptionId = voteOpt.get().getOptionId();
                hasVoted = true;
            }
        }

        final Long finalVotedOptionId = votedOptionId;
        final boolean finalHasVoted = hasVoted;

        List<PollOptionDto> optionDtos = poll.getOptions().stream()
                .map(opt -> {
                    double percent = totalVotes > 0 ? (double) opt.getVotesCount() / totalVotes * 100.0 : 0.0;
                    return PollOptionDto.builder()
                            .id(opt.getId())
                            .optionText(opt.getOptionText())
                            .votesCount(opt.getVotesCount())
                            .votePercentage(Math.round(percent * 10.0) / 10.0)
                            .build();
                })
                .collect(Collectors.toList());

        return PollDto.builder()
                .id(poll.getId())
                .postId(poll.getPost() != null ? poll.getPost().getId() : null)
                .question(poll.getQuestion())
                .options(optionDtos)
                .totalVotes(totalVotes)
                .userVotedOptionId(finalVotedOptionId)
                .hasVoted(finalHasVoted)
                .createdAt(poll.getCreatedAt())
                .build();
    }

    @CircuitBreaker(name = "connectionService", fallbackMethod = "isFirstDegreeConnectionFallback")
    public boolean isFirstDegreeConnection(Long authorId, Long currentUserId) {
        if (authorId.equals(currentUserId)) {
            return true;
        }

        Boolean connected = connectionClient.areConnected(authorId);
        if (connected != null && connected) {
            return true;
        }

        List<PersonDto> connections = connectionClient.getFirstDegreeConnections(authorId);
        if (connections != null) {
            return connections.stream().anyMatch(p -> currentUserId.equals(p.getUserId()));
        }

        return false;
    }

    public boolean isFirstDegreeConnectionFallback(Long authorId, Long currentUserId, Throwable throwable) {
        log.error("Circuit breaker fallback triggered for isFirstDegreeConnection({}, {}). Remote connection-service error: {}",
                authorId, currentUserId, throwable.getMessage());
        return false;
    }

    public List<PostDto> searchPosts(String query, String sort, int page, int size, Long currentUserId) {
        log.info("Searching posts with query: '{}', sort: '{}', page: {}, size: {}", query, sort, page, size);
        String normalized = query != null ? query.trim().toLowerCase() : "";
        List<Post> posts;
        if (normalized.isBlank()) {
            posts = postRepository.findAllByOrderByCreatedAtDesc();
        } else {
            posts = postRepository.searchPostsByContentAll(normalized);
        }

        List<PostDto> dtos = posts.stream()
                .map(p -> mapToDtoWithPoll(p, currentUserId))
                .collect(Collectors.toList());

        if ("popular".equalsIgnoreCase(sort)) {
            dtos.sort((a, b) -> {
                int likesA = a.getLikesCount() != null ? a.getLikesCount() : 0;
                int likesB = b.getLikesCount() != null ? b.getLikesCount() : 0;
                return Integer.compare(likesB, likesA);
            });
        } else {
            // Default "recent" sort
            dtos.sort((a, b) -> {
                if (a.getCreatedAt() == null || b.getCreatedAt() == null) return 0;
                return b.getCreatedAt().compareTo(a.getCreatedAt());
            });
        }

        int start = Math.min(page * size, dtos.size());
        int end = Math.min(start + size, dtos.size());
        return dtos.subList(start, end);
    }

    public List<HashtagDto> searchHashtags(String query) {
        String normalized = query != null ? query.trim().toLowerCase().replace("#", "") : "";
        List<Post> allPosts = postRepository.findAll();
        Map<String, Long> tagCounts = new HashMap<>();

        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("#([a-zA-Z0-9_]+)");
        for (Post p : allPosts) {
            if (p.getContent() != null) {
                java.util.regex.Matcher matcher = pattern.matcher(p.getContent());
                Set<String> postTags = new HashSet<>();
                while (matcher.find()) {
                    postTags.add(matcher.group(1).toLowerCase());
                }
                for (String t : postTags) {
                    tagCounts.put(t, tagCounts.getOrDefault(t, 0L) + 1L);
                }
            }
        }

        List<HashtagDto> result = new ArrayList<>();
        for (Map.Entry<String, Long> entry : tagCounts.entrySet()) {
            if (normalized.isBlank() || entry.getKey().contains(normalized)) {
                result.add(HashtagDto.builder()
                        .tag(entry.getKey())
                        .displayName("#" + entry.getKey())
                        .postCount(entry.getValue())
                        .build());
            }
        }

        result.sort((a, b) -> {
            int cmp = Long.compare(b.getPostCount(), a.getPostCount());
            if (cmp != 0) return cmp;
            return a.getTag().compareToIgnoreCase(b.getTag());
        });

        return result;
    }

    public PostSuggestionsDto getPostSuggestions(String query) {
        String normalized = query != null ? query.trim().toLowerCase() : "";
        if (normalized.isBlank()) {
            return PostSuggestionsDto.builder()
                    .hashtags(Collections.emptyList())
                    .posts(Collections.emptyList())
                    .build();
        }

        List<HashtagDto> hashtags = searchHashtags(normalized);
        if (hashtags.size() > 4) {
            hashtags = hashtags.subList(0, 4);
        }

        List<Post> posts = postRepository.searchPostsByContent(normalized, org.springframework.data.domain.PageRequest.of(0, 3));
        List<PostSuggestionsDto.PostSnippetDto> postSnippets = posts.stream()
                .map(p -> {
                    String snippet = p.getContent() != null
                            ? (p.getContent().length() > 60 ? p.getContent().substring(0, 60) + "..." : p.getContent())
                            : "";
                    return PostSuggestionsDto.PostSnippetDto.builder()
                            .id(p.getId())
                            .userId(p.getUserId())
                            .contentSnippet(snippet)
                            .mediaUrl(p.getMediaUrl())
                            .build();
                })
                .collect(Collectors.toList());

        return PostSuggestionsDto.builder()
                .hashtags(hashtags)
                .posts(postSnippets)
                .build();
    }
}