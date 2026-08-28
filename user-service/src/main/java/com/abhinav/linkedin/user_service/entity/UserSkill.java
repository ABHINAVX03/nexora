package com.abhinav.linkedin.user_service.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(
    name = "user_skills",
    uniqueConstraints = {
        @UniqueConstraint(name = "uq_user_skill", columnNames = {"userId", "skill_id"})
    },
    indexes = {
        @Index(name = "idx_user_skills_user", columnList = "userId"),
        @Index(name = "idx_user_skills_display", columnList = "userId, displayOrder")
    }
)
public class UserSkill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "skill_id", nullable = true)
    private Skill skill;

    @Column(nullable = false)
    private String skillName;

    @Column(nullable = false)
    @Builder.Default
    private Integer endorsementCount = 0;

    @Column(nullable = false)
    @Builder.Default
    private Integer displayOrder = 0;

    @OneToMany(mappedBy = "userSkill", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<SkillEndorsement> endorsements = new ArrayList<>();

    @CreationTimestamp
    private LocalDateTime createdAt;
}
