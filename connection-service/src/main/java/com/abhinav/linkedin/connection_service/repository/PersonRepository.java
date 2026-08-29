package com.abhinav.linkedin.connection_service.repository;

import com.abhinav.linkedin.connection_service.entity.Person;
import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.data.neo4j.repository.query.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PersonRepository extends Neo4jRepository<Person, Long> {

    @Query("""
        MATCH (personA:Person)-[:CONNECTED_TO]-(personB:Person)
        WHERE personA.userId = $userId
        RETURN personB
        """)
    List<Person> getFirstDegreeConnections(Long userId);

    @Query("""
        OPTIONAL MATCH (personA:Person {userId: $userId1})-[:CONNECTED_TO]-(personB:Person {userId: $userId2})
        RETURN count(personB) > 0
        """)
    boolean areConnected(Long userId1, Long userId2);

    @Query("""
        OPTIONAL MATCH (sender:Person {userId: $senderId})-[r:REQUESTED_TO]->(receiver:Person {userId: $receiverId})
        RETURN count(r) > 0
        """)
    boolean hasPendingRequest(Long senderId, Long receiverId);

    @Query("""
        MERGE (sender:Person {userId: $senderId})
        MERGE (receiver:Person {userId: $receiverId})
        MERGE (sender)-[:REQUESTED_TO]->(receiver)
        """)
    void sendConnectionRequest(Long senderId, Long receiverId);

    @Query("""
        MATCH (sender:Person {userId: $senderId})-[r:REQUESTED_TO]->(receiver:Person {userId: $receiverId})
        DELETE r
        MERGE (sender)-[:CONNECTED_TO]->(receiver)
        """)
    void acceptConnectionRequest(Long senderId, Long receiverId);

    @Query("""
        MATCH (sender:Person {userId: $senderId})-[r:REQUESTED_TO]->(receiver:Person {userId: $receiverId})
        DELETE r
        """)
    void rejectConnectionRequest(Long senderId, Long receiverId);

    @Query("""
        MATCH (sender:Person {userId: $senderId})-[r:REQUESTED_TO]->(receiver:Person {userId: $receiverId})
        DELETE r
        """)
    void cancelConnectionRequest(Long senderId, Long receiverId);

    @Query("""
        MATCH (personA:Person {userId: $userId1})-[r:CONNECTED_TO]-(personB:Person {userId: $userId2})
        DELETE r
        """)
    void removeConnection(Long userId1, Long userId2);

    @Query("""
        MATCH (sender:Person)-[:REQUESTED_TO]->(receiver:Person {userId: $userId})
        RETURN sender
        """)
    List<Person> getPendingRequests(Long userId);
}