package com.discordmini.file.service;

import com.discordmini.file.exception.FileValidationException;
import com.discordmini.file.model.dto.FileResponse;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.RemoveObjectArgs;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.tika.Tika;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.time.YearMonth;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class StorageService {

    private final MinioClient minioClient;

    @Value("${b2.bucket-name}")
    private String bucketName;

    @Value("${b2.endpoint}")
    private String endpoint;

    private static final List<String> ALLOWED_MIME_PREFIXES = List.of(
            "image/", "audio/", "video/"
    );

    private static final List<String> ALLOWED_MIME_EXACT = List.of(
            "application/pdf",
            "text/plain",
            "application/zip",
            "application/json",
            "text/csv",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // docx
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // xlsx
            "application/vnd.openxmlformats-officedocument.presentationml.presentation" // pptx
    );

    private static final List<String> BLOCKED_EXTENSIONS = List.of(
            ".exe", ".bat", ".sh", ".ps1", ".cmd", ".msi", ".dll", ".vbs"
    );

    public FileResponse uploadFile(String userId, MultipartFile file) {
        if (file.isEmpty()) {
            throw new FileValidationException("File is empty");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isBlank()) {
            throw new FileValidationException("File name is missing");
        }
        
        if (originalFilename.length() > 255) {
            throw new FileValidationException("File name is too long");
        }

        // 1. Validate Extension
        String lowerName = originalFilename.toLowerCase();
        for (String ext : BLOCKED_EXTENSIONS) {
            if (lowerName.endsWith(ext)) {
                throw new FileValidationException("Executable files are not allowed");
            }
        }

        // 2. Magic Bytes MIME type validation via Apache Tika
        String detectedMimeType;
        try (InputStream is = file.getInputStream()) {
            Tika tika = new Tika();
            detectedMimeType = tika.detect(is);
        } catch (Exception e) {
            log.error("Error reading file for MIME detection", e);
            throw new FileValidationException("Could not verify file content type");
        }

        if (!isMimeTypeAllowed(detectedMimeType)) {
            log.warn("Blocked file upload. Name: {}, Detected MIME: {}", originalFilename, detectedMimeType);
            throw new FileValidationException("File type not allowed: " + detectedMimeType);
        }

        // 3. Generate key and upload
        String extension = getExtension(originalFilename);
        String fileKey = String.format("%s/%s/%s%s",
                userId,
                YearMonth.now().toString(),
                UUID.randomUUID().toString(),
                extension);

        try (InputStream is = file.getInputStream()) {
            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucketName)
                            .object(fileKey)
                            .stream(is, file.getSize(), -1)
                            .contentType(detectedMimeType)
                            .build()
            );
        } catch (Exception e) {
            log.error("Failed to upload file to B2", e);
            throw new RuntimeException("Failed to upload file");
        }

        // B2 S3-compatible public URL format
        // https://{endpoint}/file/{bucket-name}/{key} OR direct path if endpoint is custom
        // For standard B2 S3: https://s3.us-west-004.backblazeb2.com/{bucketName}/{fileKey}
        // Actually, Backblaze B2 S3 public URL format is: https://{endpoint}/{bucketName}/{fileKey}
        // But commonly with native B2 it's f00X.backblazeb2.com/file/...
        // Let's use the S3 format since we are using MinIO (S3 SDK).
        String fileUrl = String.format("%s/%s/%s", endpoint, bucketName, fileKey);

        return FileResponse.builder()
                .fileUrl(fileUrl)
                .fileName(originalFilename)
                .fileSize(file.getSize())
                .contentType(detectedMimeType)
                .fileKey(fileKey)
                .build();
    }

    public void deleteFile(String userId, String fileKey) {
        // Enforce that a user can only delete their own files
        if (!fileKey.startsWith(userId + "/")) {
            throw new FileValidationException("You can only delete your own files");
        }

        try {
            minioClient.removeObject(
                    RemoveObjectArgs.builder()
                            .bucket(bucketName)
                            .object(fileKey)
                            .build()
            );
            log.info("Deleted file: {}", fileKey);
        } catch (Exception e) {
            log.error("Failed to delete file from B2", e);
            throw new RuntimeException("Failed to delete file");
        }
    }

    private boolean isMimeTypeAllowed(String mimeType) {
        if (mimeType == null) return false;
        if (ALLOWED_MIME_EXACT.contains(mimeType)) return true;
        for (String prefix : ALLOWED_MIME_PREFIXES) {
            if (mimeType.startsWith(prefix)) return true;
        }
        return false;
    }

    private String getExtension(String filename) {
        int lastDotIndex = filename.lastIndexOf('.');
        if (lastDotIndex > 0 && lastDotIndex < filename.length() - 1) {
            return filename.substring(lastDotIndex); // includes the dot
        }
        return "";
    }
}
