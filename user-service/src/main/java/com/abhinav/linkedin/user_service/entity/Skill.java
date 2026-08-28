package com.abhinav.linkedin.user_service.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(
    name = "skills",
    indexes = {
        @Index(name = "idx_skill_name", columnList = "name"),
        @Index(name = "idx_skill_normalized_name", columnList = "normalizedName", unique = true)
    }
)
public class Skill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = false, unique = true)
    private String normalizedName; // Lowercase, trimmed for deduplication (e.g. "java 21")

    @Column(nullable = true)
    private String category; // Backend, Frontend, DevOps, Database, Architecture, etc.
}
