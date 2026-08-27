package com.abhinav.linkedin.connection_service.controller;

import com.abhinav.linkedin.connection_service.auth.UserContextFilter;
import com.abhinav.linkedin.connection_service.entity.Person;
import com.abhinav.linkedin.connection_service.exception.GlobalExceptionHandler;
import com.abhinav.linkedin.connection_service.service.ConnectionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ConnectionControllerTest {

    private MockMvc mockMvc;
    private ConnectionService connectionService;

    @BeforeEach
    void setUp() {
        connectionService = Mockito.mock(ConnectionService.class);
        ConnectionController controller = new ConnectionController(connectionService);

        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .addFilters(new UserContextFilter())
                .build();
    }

    @Test
    void testGetMyFirstConnections_withHeader_returnsOk() throws Exception {
        Person person = Person.builder().userId(2L).username("User 2").build();
        when(connectionService.getFirstDegreeConnections(1L)).thenReturn(List.of(person));

        mockMvc.perform(get("/connections/first-degree")
                        .header("X-User-Id", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].userId").value(2));
    }

    @Test
    void testSendConnectionRequest_withHeader_returnsCreated() throws Exception {
        doNothing().when(connectionService).sendConnectionRequest(1L, 2L);

        mockMvc.perform(post("/connections/request/2")
                        .header("X-User-Id", "1"))
                .andExpect(status().isCreated());

        verify(connectionService).sendConnectionRequest(1L, 2L);
    }

    @Test
    void testAcceptConnectionRequest_withHeader_returnsOk() throws Exception {
        doNothing().when(connectionService).acceptConnectionRequest(1L, 2L);

        mockMvc.perform(post("/connections/accept/2")
                        .header("X-User-Id", "1"))
                .andExpect(status().isOk());

        verify(connectionService).acceptConnectionRequest(1L, 2L);
    }

    @Test
    void testAreConnected_returnsBoolean() throws Exception {
        when(connectionService.areConnected(1L, 2L)).thenReturn(true);

        mockMvc.perform(get("/connections/check/2")
                        .header("X-User-Id", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").value(true));
    }
}
