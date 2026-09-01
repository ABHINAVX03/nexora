// Centralized error parsing and user-friendly exception handler for Nexora

export interface ParsedApiError {
  title: string;
  message: string;
  isNotFound: boolean;
  isInvalidPassword: boolean;
  isUnverified: boolean;
  isRateLimited: boolean;
  isNetworkError: boolean;
  isServerError: boolean;
  isSessionExpired: boolean;
  status?: number;
}

export function parseApiError(
  err: any,
  fallbackMessage = 'An unexpected error occurred. Please try again.'
): ParsedApiError {
  // 1. Check for network error / no response (offline, timeout, refused)
  if (!err?.response) {
    if (err?.code === 'ECONNABORTED' || err?.message?.toLowerCase().includes('timeout')) {
      return {
        title: 'Request Timeout',
        message: 'The server took too long to respond. Please check your connection and try again.',
        isNotFound: false,
        isInvalidPassword: false,
        isUnverified: false,
        isRateLimited: false,
        isNetworkError: true,
        isServerError: false,
        isSessionExpired: false,
      };
    }
    return {
      title: 'Connection Error',
      message: 'Unable to connect to Nexora servers. Please check your internet connection and try again.',
      isNotFound: false,
      isInvalidPassword: false,
      isUnverified: false,
      isRateLimited: false,
      isNetworkError: true,
      isServerError: false,
      isSessionExpired: false,
    };
  }

  const status = err.response.status;
  const data = err.response.data;

  // Extract raw error message string
  let rawMsg = '';
  if (typeof data === 'string') {
    rawMsg = data;
  } else if (data && typeof data === 'object') {
    rawMsg = data.message || data.error || data.detail || '';
    if (!rawMsg && Array.isArray(data.errors) && data.errors.length > 0) {
      const firstErr = data.errors[0];
      rawMsg = typeof firstErr === 'string' ? firstErr : firstErr.defaultMessage || firstErr.message || '';
    }
  }

  const lower = rawMsg.toLowerCase();

  // 2. Status 404: User Not Found
  if (status === 404 || lower.includes('user not found') || lower.includes('no account found') || lower.includes('not found with this email')) {
    return {
      title: 'Account Not Found',
      message: rawMsg || 'No account exists with this email address. Please check for typos or create a new account.',
      isNotFound: true,
      isInvalidPassword: false,
      isUnverified: false,
      isRateLimited: false,
      isNetworkError: false,
      isServerError: false,
      isSessionExpired: false,
      status,
    };
  }

  // 3. Status 400: Incorrect Password
  if (lower.includes('incorrect password') || lower.includes('invalid password') || lower.includes('bad credentials')) {
    return {
      title: 'Incorrect Password',
      message: 'The password you entered is incorrect. Please try again or use "Forgot password?" to reset it.',
      isNotFound: false,
      isInvalidPassword: true,
      isUnverified: false,
      isRateLimited: false,
      isNetworkError: false,
      isServerError: false,
      isSessionExpired: false,
      status,
    };
  }

  // 4. Email Not Verified
  if (lower.includes('email_not_verified') || lower.includes('not verified') || lower.includes('verify your email')) {
    return {
      title: 'Email Verification Required',
      message: 'Your account email has not been verified yet. We have sent a 6-digit confirmation code to your inbox.',
      isNotFound: false,
      isInvalidPassword: false,
      isUnverified: true,
      isRateLimited: false,
      isNetworkError: false,
      isServerError: false,
      isSessionExpired: false,
      status,
    };
  }

  // 5. Status 429: Rate Limit
  if (status === 429 || lower.includes('rate limit') || lower.includes('too many requests')) {
    return {
      title: 'Rate Limit Exceeded',
      message: 'Too many login attempts detected. For security, please wait 30 seconds before trying again.',
      isNotFound: false,
      isInvalidPassword: false,
      isUnverified: false,
      isRateLimited: true,
      isNetworkError: false,
      isServerError: false,
      isSessionExpired: false,
      status,
    };
  }

  // 6. Status 401: Session Expired / Logged in elsewhere
  if (status === 401 || lower.includes('session expired') || lower.includes('another browser or device')) {
    return {
      title: 'Session Expired',
      message: rawMsg || 'You were signed out because your account was logged in from another device.',
      isNotFound: false,
      isInvalidPassword: false,
      isUnverified: false,
      isRateLimited: false,
      isNetworkError: false,
      isServerError: false,
      isSessionExpired: true,
      status,
    };
  }

  // 7. Status 500 / 502 / 503 / 504: Server Error
  if (status >= 500) {
    return {
      title: 'Server Temporarily Unavailable',
      message: 'Our authentication service is currently updating or restarting. Please try again in a few moments.',
      isNotFound: false,
      isInvalidPassword: false,
      isUnverified: false,
      isRateLimited: false,
      isNetworkError: false,
      isServerError: true,
      isSessionExpired: false,
      status,
    };
  }

  return {
    title: 'Authentication Error',
    message: rawMsg || fallbackMessage,
    isNotFound: false,
    isInvalidPassword: false,
    isUnverified: false,
    isRateLimited: false,
    isNetworkError: false,
    isServerError: false,
    isSessionExpired: false,
    status,
  };
}
