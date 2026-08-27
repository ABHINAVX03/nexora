package com.abhinav.linkedin.notification_service;

import com.abhinav.linkedin.notification_service.client.ConnectionClient;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.kafka.admin.auto-create=false",
        "spring.kafka.listener.auto-startup=false"
})
class NotificationServiceApplicationTests {

    @MockitoBean
    private ConnectionClient connectionClient;

    @Test
    void contextLoads() {
    }

}
