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
    name = "companies",
    indexes = {
        @Index(name = "idx_company_name", columnList = "name")
    }
)
public class Company {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = true)
    private String domain;

    @Column(nullable = true, length = 1000)
    private String logoUrl;

    @Column(nullable = true)
    private String industry;

    @Column(nullable = true)
    private String location;
}
