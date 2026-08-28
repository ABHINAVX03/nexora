package com.abhinav.linkedin.user_service.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(
    name = "educations",
    indexes = {
        @Index(name = "idx_education_user_id", columnList = "userId"),
        @Index(name = "idx_education_start_year", columnList = "startYear")
    }
)
public class Education {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "institution_id", nullable = true)
    private EducationalInstitution institution;

    @Column(nullable = false)
    private String institutionName;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isCustomInstitution = false;

    @Column(nullable = false)
    private String degree; // e.g. "Bachelor of Technology - BTech", "Master of Science - MS"

    @Column(nullable = true)
    private String fieldOfStudy; // e.g. "Computer Science & Engineering"

    @Column(nullable = false)
    private Integer startYear;

    @Column(nullable = true)
    private Integer endYear;

    @Column(nullable = true)
    private String grade; // e.g. "9.4 CGPA"

    @Column(nullable = true, length = 2000)
    private String description;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
