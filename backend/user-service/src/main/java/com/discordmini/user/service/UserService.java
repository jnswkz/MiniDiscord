package com.discordmini.user.service;

import com.discordmini.common.exception.BaseException;
import com.discordmini.user.exception.UserNotFoundException;
import com.discordmini.user.model.dto.UserResponse;
import com.discordmini.user.model.entity.User;
import com.discordmini.user.model.mapper.UserMapper;
import com.discordmini.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public UserResponse getUserById(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));
        return UserMapper.toResponse(user);
    }

    @Transactional
    public UserResponse updateProfile(UUID userId, String username, String avatarUrl) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        if (username != null && !username.equals(user.getUsername())) {
            if (userRepository.existsByUsername(username)) {
                throw new BaseException("Username already taken", HttpStatus.CONFLICT, "USERNAME_EXISTS");
            }
            user.setUsername(username);
        }

        if (avatarUrl != null) {
            user.setAvatarUrl(avatarUrl);
        }

        user = userRepository.save(user);
        return UserMapper.toResponse(user);
    }

    @Transactional
    public void updateStatus(UUID userId, String status) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));
        user.setStatus(status);
        user.setLastSeenAt(LocalDateTime.now());
        userRepository.save(user);
    }
}
