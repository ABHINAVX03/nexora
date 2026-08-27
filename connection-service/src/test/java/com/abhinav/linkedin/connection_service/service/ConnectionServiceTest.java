package com.abhinav.linkedin.connection_service.service;

import com.abhinav.linkedin.connection_service.entity.Person;
import com.abhinav.linkedin.connection_service.event.ConnectionAcceptedEvent;
import com.abhinav.linkedin.connection_service.event.ConnectionRequestEvent;
import com.abhinav.linkedin.connection_service.exception.BadRequestException;
import com.abhinav.linkedin.connection_service.exception.ResourceNotFoundException;
import com.abhinav.linkedin.connection_service.repository.PersonRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ConnectionServiceTest {

    @Mock
    private PersonRepository personRepository;

    @Mock
    private KafkaTemplate<Long, Object> kafkaTemplate;

    @InjectMocks
    private ConnectionService connectionService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(connectionService, "connectionRequestTopic", "send-connection-request-topic");
        ReflectionTestUtils.setField(connectionService, "connectionAcceptedTopic", "accept-connection-request-topic");
    }

    @Test
    void getFirstDegreeConnections_returnsList() {
        Person person = Person.builder().userId(2L).username("User 2").build();
        when(personRepository.getFirstDegreeConnections(1L)).thenReturn(List.of(person));

        List<Person> result = connectionService.getFirstDegreeConnections(1L);

        assertEquals(1, result.size());
        assertEquals(2L, result.get(0).getUserId());
    }

    @Test
    void areConnected_sameUser_returnsTrue() {
        assertTrue(connectionService.areConnected(1L, 1L));
    }

    @Test
    void areConnected_connectedUsers_returnsTrue() {
        when(personRepository.areConnected(1L, 2L)).thenReturn(true);
        assertTrue(connectionService.areConnected(1L, 2L));
    }

    @Test
    void sendConnectionRequest_toSelf_throwsBadRequest() {
        assertThrows(BadRequestException.class, () -> connectionService.sendConnectionRequest(1L, 1L));
    }

    @Test
    void sendConnectionRequest_alreadyConnected_throwsBadRequest() {
        when(personRepository.areConnected(1L, 2L)).thenReturn(true);
        assertThrows(BadRequestException.class, () -> connectionService.sendConnectionRequest(1L, 2L));
    }

    @Test
    void sendConnectionRequest_alreadyPending_throwsBadRequest() {
        when(personRepository.areConnected(1L, 2L)).thenReturn(false);
        when(personRepository.hasPendingRequest(1L, 2L)).thenReturn(true);
        assertThrows(BadRequestException.class, () -> connectionService.sendConnectionRequest(1L, 2L));
    }

    @Test
    void sendConnectionRequest_success_sendsKafkaEvent() {
        when(personRepository.areConnected(1L, 2L)).thenReturn(false);
        when(personRepository.hasPendingRequest(1L, 2L)).thenReturn(false);

        connectionService.sendConnectionRequest(1L, 2L);

        verify(personRepository).sendConnectionRequest(1L, 2L);
        ArgumentCaptor<ConnectionRequestEvent> captor = ArgumentCaptor.forClass(ConnectionRequestEvent.class);
        verify(kafkaTemplate).send(eq("send-connection-request-topic"), eq(2L), captor.capture());

        assertEquals(1L, captor.getValue().getSenderId());
        assertEquals(2L, captor.getValue().getReceiverId());
    }

    @Test
    void acceptConnectionRequest_success_sendsKafkaEvent() {
        when(personRepository.hasPendingRequest(1L, 2L)).thenReturn(true);

        connectionService.acceptConnectionRequest(2L, 1L);

        verify(personRepository).acceptConnectionRequest(1L, 2L);
        ArgumentCaptor<ConnectionAcceptedEvent> captor = ArgumentCaptor.forClass(ConnectionAcceptedEvent.class);
        verify(kafkaTemplate).send(eq("accept-connection-request-topic"), eq(1L), captor.capture());

        assertEquals(1L, captor.getValue().getSenderId());
        assertEquals(2L, captor.getValue().getReceiverId());
    }

    @Test
    void acceptConnectionRequest_noPending_throwsResourceNotFound() {
        when(personRepository.hasPendingRequest(1L, 2L)).thenReturn(false);
        assertThrows(ResourceNotFoundException.class, () -> connectionService.acceptConnectionRequest(2L, 1L));
    }

    @Test
    void rejectConnectionRequest_success() {
        when(personRepository.hasPendingRequest(1L, 2L)).thenReturn(true);

        connectionService.rejectConnectionRequest(2L, 1L);

        verify(personRepository).rejectConnectionRequest(1L, 2L);
    }
}
