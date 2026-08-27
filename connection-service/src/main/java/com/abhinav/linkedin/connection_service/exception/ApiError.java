package com.abhinav.linkedin.connection_service.exception;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiError {

    private int status;
    private String message;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime timestamp;

    private List<String> errors;

    public ApiError(int status, String message, LocalDateTime timestamp) {
        this.status = status;
        this.message = message;
        this.timestamp = timestamp;
    }

    public ApiError(int status, String message, LocalDateTime timestamp, List<String> errors) {
        this.status = status;
        this.message = message;
        this.timestamp = timestamp;
        this.errors = errors;
    }
}
