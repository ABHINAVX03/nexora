package com.abhinav.linkedin.user_service.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(
    name = "experiences",
    indexes = {
        @Index(name = "idx_experience_user_id", columnList = "userId"),
        @Index(name = "idx_experience_start_date", columnList = "startDate")
    }
)
public class Experience {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "company_id", nullable = true)
    private Company company;

    @Column(nullable = false)
    private String companyName;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isCustomCompany = false;

    @Column(nullable = false)
    private String title;

    @Column(nullable = true)
    private String employmentType; // Full-time, Part-time, Contract, Internship, Freelance

    @Column(nullable = true)
    private String location;

    @Column(nullable = false)
    private LocalDate startDate;

    @Column(nullable = true)
    private LocalDate endDate;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isCurrentlyWorking = false;

    @Column(nullable = true, length = 2500)
    private String description;

    @Column(nullable = true, length = 1000)
    private String skills; // Comma-separated skills used (e.g. "Java 21, Spring Boot, Kafka, AWS")

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
