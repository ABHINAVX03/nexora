package com.abhinav.linkedin.posts_service;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication
@EnableFeignClients
public class PostsServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(PostsServiceApplication.class, args);
	}
}
