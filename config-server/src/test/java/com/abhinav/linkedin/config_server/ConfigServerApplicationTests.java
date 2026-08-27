package com.abhinav.linkedin.config_server;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {
        "spring.cloud.config.server.git.uri=file://${user.dir}/config-repo",
        "eureka.client.enabled=false"
})
class ConfigServerApplicationTests {

    @Test
    void contextLoads() {
    }
}
