package com.discordmini.file.service;

import com.discordmini.file.exception.FileValidationException;
import com.discordmini.file.model.dto.FileResponse;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.RemoveObjectArgs;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.ByteArrayInputStream;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StorageServiceTest {

    @Mock
    private MinioClient minioClient;

    @InjectMocks
    private StorageService storageService;

    @Captor
    private ArgumentCaptor<PutObjectArgs> putObjectArgsCaptor;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(storageService, "bucketName", "test-bucket");
        ReflectionTestUtils.setField(storageService, "endpoint", "http://localhost:9000");
    }

    // A valid PNG header to trick Tika into detecting image/png
    private final byte[] validPngData = new byte[] {
            (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 0, 0, 0, 0, 0
    };

    @Test
    void uploadFile_ValidImage_ReturnsFileUrl() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "test.png", "image/png", validPngData);

        FileResponse response = storageService.uploadFile("user1", file);

        assertNotNull(response);
        assertTrue(response.getFileUrl().startsWith("http://localhost:9000/test-bucket/user1/"));
        assertTrue(response.getFileUrl().endsWith(".png"));
        assertEquals("test.png", response.getFileName());
        assertEquals("image/png", response.getContentType());
        
        verify(minioClient).putObject(putObjectArgsCaptor.capture());
        PutObjectArgs args = putObjectArgsCaptor.getValue();
        assertEquals("test-bucket", args.bucket());
        assertEquals("image/png", args.contentType());
    }

    @Test
    void uploadFile_EmptyFile_ThrowsException() {
        MockMultipartFile file = new MockMultipartFile("file", "test.png", "image/png", new byte[0]);

        assertThrows(FileValidationException.class, () -> storageService.uploadFile("user1", file));
        
        try {
            verify(minioClient, never()).putObject(any());
        } catch (Exception ignored) {}
    }

    @Test
    void uploadFile_BlockedExtension_ThrowsException() {
        MockMultipartFile file = new MockMultipartFile("file", "test.exe", "application/x-msdownload", "some random data".getBytes());

        assertThrows(FileValidationException.class, () -> storageService.uploadFile("user1", file));
    }

    @Test
    void uploadFile_MimeSpoofing_ThrowsException() {
        // Filename says .png, but content is just text (Tika will detect text/plain)
        MockMultipartFile file = new MockMultipartFile("file", "fake.png", "image/png", "Hello World!".getBytes());

        // Wait, text/plain is actually in the allowed whitelist! 
        // Let's use a byte sequence that Tika detects as application/octet-stream or something blocked.
        byte[] randomBytes = new byte[] { 0x01, 0x02, 0x03, 0x04 };
        MockMultipartFile spoofedFile = new MockMultipartFile("file", "fake.png", "image/png", randomBytes);

        assertThrows(FileValidationException.class, () -> storageService.uploadFile("user1", spoofedFile));
    }

    @Test
    void deleteFile_OwnFile_Success() throws Exception {
        storageService.deleteFile("user1", "user1/2026-05/abc.png");

        verify(minioClient).removeObject(any(RemoveObjectArgs.class));
    }

    @Test
    void deleteFile_OtherUsersFile_ThrowsException() {
        assertThrows(FileValidationException.class, () -> storageService.deleteFile("user1", "user2/2026-05/abc.png"));

        try {
            verify(minioClient, never()).removeObject(any());
        } catch (Exception ignored) {}
    }
}
