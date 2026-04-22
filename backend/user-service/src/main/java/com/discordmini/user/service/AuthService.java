package com.discordmini.user.service;

import com.discordmini.common.exception.BaseException;
import com.discordmini.user.model.dto.AuthResponse;
import com.discordmini.user.model.dto.LoginRequest;
import com.discordmini.user.model.dto.RegisterRequest;
import com.discordmini.user.model.entity.User;
import com.discordmini.user.model.mapper.UserMapper;
import com.discordmini.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BaseException("Email already registered", HttpStatus.CONFLICT, "EMAIL_EXISTS");
        }
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BaseException("Username already taken", HttpStatus.CONFLICT, "USERNAME_EXISTS");
        }

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .build();

        user = userRepository.save(user);

        String token = jwtService.generateToken(
                user.getId().toString(),
                user.getEmail(),
                user.getRole().name()
        );

        return AuthResponse.builder()
                .token(token)
                .user(UserMapper.toResponse(user))
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        if (!user.getIsActive()) {
            throw new BaseException("Account is deactivated", HttpStatus.FORBIDDEN, "ACCOUNT_INACTIVE");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid email or password");
        }

        String token = jwtService.generateToken(
                user.getId().toString(),
                user.getEmail(),
                user.getRole().name()
        );

        return AuthResponse.builder()
                .token(token)
                .user(UserMapper.toResponse(user))
                .build();
    }
}
