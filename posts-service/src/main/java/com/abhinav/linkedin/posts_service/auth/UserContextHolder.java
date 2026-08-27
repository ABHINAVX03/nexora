package com.abhinav.linkedin.posts_service.auth;

public class UserContextHolder {

    private static final ThreadLocal<Long> CURRENT_USER_ID = new ThreadLocal<>();

    public static Long getCurrentUserId() {
        return CURRENT_USER_ID.get();
    }

    public static void setCurrentUserId(Long userId) {
        CURRENT_USER_ID.set(userId);
    }

    public static void clear() {
        CURRENT_USER_ID.remove();
    }
}
