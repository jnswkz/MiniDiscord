package com.discordmini.groupchannel.repository;

import com.discordmini.groupchannel.model.entity.Room;
import com.discordmini.groupchannel.model.enums.RoomType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RoomRepository extends JpaRepository<Room, UUID> {
    Optional<Room> findByNameAndType(String name, RoomType type);
    
    List<Room> findByIdIn(List<UUID> ids);
}
