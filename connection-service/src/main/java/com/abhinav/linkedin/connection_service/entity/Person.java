package com.abhinav.linkedin.connection_service.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.neo4j.core.schema.Id;
import org.springframework.data.neo4j.core.schema.Node;

@Node("Person")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Person {

    @Id
    private Long userId;

    private String username;
}
