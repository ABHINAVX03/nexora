package com.abhinav.linkedin.user_service.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(
    name = "skill_endorsements",
    uniqueConstraints = {
        @UniqueConstraint(name = "uq_skill_endorsement", columnNames = {"user_id", "skill_id", "endorser_id"})
    },
    indexes = {
        @Index(name = "idx_endorsement_userskill", columnList = "user_skill_id"),
        @Index(name = "idx_endorsement_user", columnList = "user_id"),
        @Index(name = "idx_endorsement_endorser", columnList = "endorser_id")
    }
)
public class SkillEndorsement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_skill_id", nullable = false)
    private UserSkill userSkill;

    @Column(name = "user_id", nullable = false)
    private Long userId; // Target user who owns the skill

    @Column(name = "skill_id", nullable = false)
    private Long skillId; // The skill ID

    @Column(name = "endorser_id", nullable = false)
    private Long endorserId; // The 1st-degree connection who endorsed

    @Column(nullable = false)
    private String endorserName;

    @Column(nullable = true)
    private String endorserHeadline;

    @Column(nullable = true, length = 1000)
    private String endorserAvatarUrl;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
