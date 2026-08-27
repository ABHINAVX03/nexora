package com.abhinav.linkedin.connection_service;

import com.abhinav.linkedin.connection_service.repository.PersonRepository;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

@SpringBootTest(properties = {
        "spring.kafka.admin.auto-create=false",
        "spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.data.neo4j.Neo4jDataAutoConfiguration,org.springframework.boot.autoconfigure.data.neo4j.Neo4jRepositoriesAutoConfiguration,org.springframework.boot.autoconfigure.neo4j.Neo4jAutoConfiguration,org.springframework.boot.autoconfigure.kafka.KafkaAutoConfiguration"
})
class ConnectionServiceApplicationTests {

    @MockitoBean
    private PersonRepository personRepository;

    @Test
    void contextLoads() {
    }

}
