package com.abhinav.linkedin.chat_service.repository;

import com.abhinav.linkedin.chat_service.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    @Query("""
        SELECT m FROM ChatMessage m
        WHERE (m.senderId = :u1 AND m.recipientId = :u2)
           OR (m.senderId = :u2 AND m.recipientId = :u1)
        ORDER BY m.createdAt ASC
        """)
    List<ChatMessage> findConversationHistory(@Param("u1") Long user1, @Param("u2") Long user2);

    @Query("""
        SELECT m FROM ChatMessage m
        WHERE (m.senderId = :u1 AND m.recipientId = :u2)
           OR (m.senderId = :u2 AND m.recipientId = :u1)
        ORDER BY m.createdAt DESC
        LIMIT 1
        """)
    Optional<ChatMessage> findLatestMessageBetween(@Param("u1") Long user1, @Param("u2") Long user2);

    @Query("""
        SELECT COUNT(m) FROM ChatMessage m
        WHERE m.recipientId = :recipientId AND m.isRead = false
        """)
    long countUnreadMessages(@Param("recipientId") Long recipientId);

    @Query("""
        SELECT COUNT(m) FROM ChatMessage m
        WHERE m.senderId = :senderId AND m.recipientId = :recipientId AND m.isRead = false
        """)
    long countUnreadBetween(@Param("senderId") Long senderId, @Param("recipientId") Long recipientId);

    @Modifying
    @Transactional
    @Query("""
        UPDATE ChatMessage m
        SET m.isRead = true
        WHERE m.senderId = :senderId AND m.recipientId = :recipientId AND m.isRead = false
        """)
    void markConversationAsRead(@Param("senderId") Long senderId, @Param("recipientId") Long recipientId);

    @Query("""
        SELECT DISTINCT CASE WHEN m.senderId = :userId THEN m.recipientId ELSE m.senderId END
        FROM ChatMessage m
        WHERE m.senderId = :userId OR m.recipientId = :userId
        """)
    List<Long> findDistinctPartnerIds(@Param("userId") Long userId);
}
