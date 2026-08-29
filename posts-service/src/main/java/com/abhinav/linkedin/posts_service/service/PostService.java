package com.abhinav.linkedin.posts_service.service;

import com.abhinav.linkedin.posts_service.client.ConnectionClient;
import com.abhinav.linkedin.posts_service.dto.*;
import com.abhinav.linkedin.posts_service.entity.Poll;
import com.abhinav.linkedin.posts_service.entity.PollOption;
import com.abhinav.linkedin.posts_service.entity.PollVote;
import com.abhinav.linkedin.posts_service.entity.Post;
import com.abhinav.linkedin.posts_service.entity.PostBookmark;
import com.abhinav.linkedin.posts_service.event.PostCreatedEvent;
import com.abhinav.linkedin.posts_service.exception.BadRequestException;
import com.abhinav.linkedin.posts_service.exception.ForbiddenException;
import com.abhinav.linkedin.posts_service.exception.ResourceNotFoundException;
import com.abhinav.linkedin.posts_service.repository.PollRepository;
import com.abhinav.linkedin.posts_service.repository.PollVoteRepository;
import com.abhinav.linkedin.posts_service.repository.PostBookmarkRepository;
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

        // Handle multi-image carousel or single image
        if (postDto.getMediaUrls() != null && !postDto.getMediaUrls().isEmpty()) {
            post.setMediaUrls(new ArrayList<>(postDto.getMediaUrls()));
            post.setMediaUrl(postDto.getMediaUrls().get(0));
        } else if (postDto.getMediaUrl() != null && !postDto.getMediaUrl().isBlank()) {
            String singleUrl = postDto.getMediaUrl().trim();
            post.setMediaUrl(singleUrl);
            post.setMediaUrls(new ArrayList<>(List.of(singleUrl)));
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

    @CacheEvict(value = "posts", key = "#postId")
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
        if (updateDto.getMediaUrls() != null && !updateDto.getMediaUrls().isEmpty()) {
            post.setMediaUrls(new ArrayList<>(updateDto.getMediaUrls()));
            post.setMediaUrl(updateDto.getMediaUrls().get(0));
        } else if (updateDto.getMediaUrl() != null) {
            post.setMediaUrl(updateDto.getMediaUrl().trim());
            post.setMediaUrls(new ArrayList<>(List.of(updateDto.getMediaUrl().trim())));
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

        Optional<Poll> pollOpt = pollRepository.findByPostId(postId);
        pollOpt.ifPresent(poll -> {
            pollVoteRepository.deleteByPollId(poll.getId());
            pollRepository.delete(poll);
        });

        postBookmarkRepository.deleteByPostId(postId);
        postLikeRepository.deleteByPostId(postId);
        postRepository.delete(post);
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

        // Populate mediaUrls list
        if (post.getMediaUrls() != null && !post.getMediaUrls().isEmpty()) {
            dto.setMediaUrls(new ArrayList<>(post.getMediaUrls()));
        } else if (post.getMediaUrl() != null && !post.getMediaUrl().isBlank()) {
            dto.setMediaUrls(new ArrayList<>(List.of(post.getMediaUrl())));
        } else {
            dto.setMediaUrls(new ArrayList<>());
        }

        // Populate Reposted Post if this is a quote/repost
        if (post.getRepostOfPostId() != null) {
            postRepository.findById(post.getRepostOfPostId()).ifPresent(origPost -> {
                PostDto origDto = modelMapper.map(origPost, PostDto.class);
                if (origPost.getMediaUrls() != null && !origPost.getMediaUrls().isEmpty()) {
                    origDto.setMediaUrls(new ArrayList<>(origPost.getMediaUrls()));
                } else if (origPost.getMediaUrl() != null) {
                    origDto.setMediaUrls(new ArrayList<>(List.of(origPost.getMediaUrl())));
                }
                Optional<Poll> origPollOpt = pollRepository.findByPostId(origPost.getId());
                origPollOpt.ifPresent(p -> origDto.setPoll(buildPollDto(p, currentUserId)));
                dto.setRepostedPost(origDto);
            });
        }

        Optional<Poll> pollOpt = pollRepository.findByPostId(post.getId());
        pollOpt.ifPresent(poll -> dto.setPoll(buildPollDto(poll, currentUserId)));
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
}