package com.discordmini.groupchannel.repository;

import com.discordmini.groupchannel.model.entity.RoomParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RoomParticipantRepository extends JpaRepository<RoomParticipant, UUID> {
    List<RoomParticipant> findByUserId(UUID userId);
    List<RoomParticipant> findByRoomId(UUID roomId);
    Optional<RoomParticipant> findByUserIdAndRoomId(UUID userId, UUID roomId);
    boolean existsByUserIdAndRoomId(UUID userId, UUID roomId);
    long countByRoomId(UUID roomId);
}
