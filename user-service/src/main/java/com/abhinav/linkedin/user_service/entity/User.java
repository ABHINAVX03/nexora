package com.abhinav.linkedin.user_service.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
@Table(name="Users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = true)
    private String headline;

    @Column(nullable = true, length = 1000)
    private String bio;

    @Column(nullable = true)
    private String location;

    @Column(nullable = true, length = 1000)
    private String avatarUrl;
}
