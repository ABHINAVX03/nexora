package com.abhinav.linkedin.chat_service.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@Table(name = "chat_messages", indexes = {
        @Index(name = "idx_chat_sender", columnList = "senderId"),
        @Index(name = "idx_chat_recipient", columnList = "recipientId"),
        @Index(name = "idx_chat_pair", columnList = "senderId, recipientId")
})
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long senderId;

    @Column(nullable = false)
    private Long recipientId;

    @Column(nullable = false, length = 4000)
    private String content;

    @Column(nullable = false)
    private boolean isRead = false;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
