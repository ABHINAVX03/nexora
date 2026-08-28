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
    name = "educational_institutions",
    indexes = {
        @Index(name = "idx_institution_name", columnList = "name"),
        @Index(name = "idx_institution_short_name", columnList = "shortName")
    }
)
public class EducationalInstitution {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = true)
    private String shortName;

    @Column(nullable = true, length = 1000)
    private String logoUrl;

    @Column(nullable = true)
    private String location;
}
