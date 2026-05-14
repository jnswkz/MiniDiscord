package com.discordmini.user.repository;

import com.discordmini.user.model.entity.Friendship;
import com.discordmini.user.model.entity.FriendshipStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FriendshipRepository extends JpaRepository<Friendship, UUID> {
    List<Friendship> findByRequesterIdOrReceiverId(UUID reqId, UUID recId);
    
    Optional<Friendship> findByRequesterIdAndReceiverId(UUID reqId, UUID recId);
    
    List<Friendship> findByReceiverIdAndStatus(UUID receiverId, FriendshipStatus status);

    @Query("SELECT COUNT(f) > 0 FROM Friendship f WHERE " +
           "(f.requesterId = :u1 AND f.receiverId = :u2) OR " +
           "(f.requesterId = :u2 AND f.receiverId = :u1)")
    boolean existsFriendship(@Param("u1") UUID u1, @Param("u2") UUID u2);
    
    @Query("SELECT f FROM Friendship f WHERE " +
           "(f.requesterId = :u1 AND f.receiverId = :u2) OR " +
           "(f.requesterId = :u2 AND f.receiverId = :u1)")
    Optional<Friendship> findFriendshipBetween(@Param("u1") UUID u1, @Param("u2") UUID u2);
}
