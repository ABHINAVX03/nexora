package com.abhinav.linkedin.posts_service.repository;

import com.abhinav.linkedin.posts_service.entity.PollVote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PollVoteRepository extends JpaRepository<PollVote, Long> {

    Optional<PollVote> findByPollIdAndUserId(Long pollId, Long userId);

    boolean existsByPollIdAndUserId(Long pollId, Long userId);

    void deleteByPollId(Long pollId);
}
