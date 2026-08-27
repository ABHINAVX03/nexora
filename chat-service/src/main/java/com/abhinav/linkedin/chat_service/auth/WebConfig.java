package com.abhinav.linkedin.chat_service.auth;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@RequiredArgsConstructor
public class WebConfig {

    private final UserContextFilter userContextFilter;

    @Bean
    public FilterRegistrationBean<UserContextFilter> userContextFilterRegistration() {
        FilterRegistrationBean<UserContextFilter> registrationBean = new FilterRegistrationBean<>();
        registrationBean.setFilter(userContextFilter);
        registrationBean.addUrlPatterns("/*");
        registrationBean.setOrder(1);
        return registrationBean;
    }
}
