package com.abhinav.linkedin.posts_service.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

@Service
@Slf4j
public class S3StorageService {

    @Value("${aws.s3.bucket:${AWS_S3_BUCKET_NAME:nexora-media-mumbai}}")
    private String bucketName;

    @Value("${aws.region:${AWS_REGION:ap-south-1}}")
    private String awsRegion;

    @Value("${aws.access-key-id:${AWS_ACCESS_KEY_ID:}}")
    private String accessKeyId;

    @Value("${aws.secret-access-key:${AWS_SECRET_ACCESS_KEY:}}")
    private String secretAccessKey;

    @Value("${aws.cloudfront.domain:${AWS_CLOUDFRONT_DOMAIN:}}")
    private String cloudFrontDomain;

    private S3Client s3Client;
    private boolean s3Enabled = false;

    @PostConstruct
    public void init() {
        if (accessKeyId != null && !accessKeyId.isBlank() && secretAccessKey != null && !secretAccessKey.isBlank()) {
            try {
                AwsBasicCredentials credentials = AwsBasicCredentials.create(accessKeyId, secretAccessKey);
                this.s3Client = S3Client.builder()
                        .region(Region.of(awsRegion))
                        .credentialsProvider(StaticCredentialsProvider.create(credentials))
                        .build();
                this.s3Enabled = true;
                log.info("S3StorageService initialized in posts-service with bucket: {} in region: {}", bucketName, awsRegion);
            } catch (Exception e) {
                log.error("Failed to initialize AWS S3 client in posts-service: {}. Falling back to local disk storage.", e.getMessage());
                this.s3Enabled = false;
            }
        } else {
            log.info("AWS S3 credentials not provided in posts-service. Using local disk storage fallback.");
            this.s3Enabled = false;
        }
    }

    public String uploadFile(String folder, String filename, MultipartFile file) throws IOException {
        String contentType = file.getContentType();
        if (contentType == null || contentType.isBlank()) {
            contentType = "image/jpeg";
        }

        if (s3Enabled && s3Client != null) {
            String s3Key = folder + "/" + filename;
            log.info("Uploading post media to AWS S3: s3://{}/{}", bucketName, s3Key);

            PutObjectRequest putRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(s3Key)
                    .contentType(contentType)
                    .cacheControl("public, max-age=31536000")
                    .build();

            s3Client.putObject(putRequest, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));

            if (cloudFrontDomain != null && !cloudFrontDomain.isBlank()) {
                String domain = cloudFrontDomain.startsWith("http") ? cloudFrontDomain : "https://" + cloudFrontDomain;
                return domain.replaceAll("/+$", "") + "/" + s3Key;
            } else {
                return String.format("https://%s.s3.%s.amazonaws.com/%s", bucketName, awsRegion, s3Key);
            }
        }

        // Local disk storage fallback
        String localDir = "uploads/" + folder;
        Path targetPath = Paths.get(localDir, filename);
        Files.createDirectories(targetPath.getParent());
        Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
        log.info("Saved post media locally to: {}", targetPath.toAbsolutePath());

        return "/api/v1/posts/media/files/" + filename;
    }
}
