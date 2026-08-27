package com.abhinav.linkedin.connection_service;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.neo4j.repository.config.EnableNeo4jRepositories;

@SpringBootApplication
@EnableNeo4jRepositories
public class ConnectionServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(ConnectionServiceApplication.class, args);
	}

}
