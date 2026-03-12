import axios from "axios";

class AuthService {
  constructor() {
    this.isRefreshing = false;
    this.failedQueue = [];
    this.setupInterceptors();
  }

  // This service works with middleware that:
  // 1. Validates tokens on the server side
  // 2. Returns 401 for invalid/expired tokens
  // 3. Client automatically attempts refresh on 401
  // 4. Refresh token is stored in cookies on the server
  // 5. If refresh fails (400+), redirects to login

  setupInterceptors() {
    // 🧩 1. Request Interceptor: Add Authorization Header
    axios.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem("token");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // 🧩 2. Response Interceptor: Handle Errors Globally
    axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // If this request is explicitly marked to skip auth refresh handling,
        // just reject and let the caller handle it.
        if (originalRequest?.skipAuthRefresh) {
          return Promise.reject(error);
        }

        // 🟥 Handle 409 Conflict (e.g., product with same name)
        if (error.response?.status === 409) {
          const serverMsg =
            error.response?.data?.message ||
            error.response?.data?.errors?.messages?.[0] ||
            "Conflict error (resource already exists).";

          // لو عندك Toast أو Alert في المشروع ممكن تضيفه هنا:
          if (window?.toast) {
            window.toast.error(`❌ ${serverMsg}`);
          } else {
            alert(`⚠️ ${serverMsg}`);
          }

          return Promise.reject({
            statuscode: 409,
            message: serverMsg,
            responseBody: error.response?.data,
          });
        }

        // 🟡 Handle 401 Unauthorized (token invalid or expired)
        if (error.response?.status === 401 && !originalRequest._retry) {
          const existingToken = localStorage.getItem("token");

          // If there's no token in storage, force user to login again
          if (!existingToken) {
            this.redirectToLogin();
            return Promise.reject(error);
          }

          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then(() => axios(originalRequest))
              .catch((err) => Promise.reject(err));
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const newToken = await this.refreshToken();

            if (newToken) {
              localStorage.setItem("token", newToken);
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              this.processQueue(null, newToken);
              return axios(originalRequest);
            } else {
              this.processQueue(new Error("Token refresh failed"), null);
              this.redirectToLogin();
              return Promise.reject(error);
            }
          } catch (refreshError) {
            this.processQueue(refreshError, null);
            this.redirectToLogin();
            return Promise.reject(error);
          } finally {
            this.isRefreshing = false;
          }
        }

        // ⛔ For all other errors (403, 404, 500, etc.)
        if (error.response?.status !== 401 && error.response?.status !== 409) {
          const serverData = error.response?.data;
          const serverMsg =
            serverData?.responseBody?.message ||
            serverData?.message ||
            (serverData?.errors && Object.values(serverData.errors).flat()[0]) ||
            (typeof serverData === 'string' ? serverData : null) ||
            error.message ||
            "An unexpected error occurred.";

          if (window?.toast) {
            window.toast.error(`❌ ${serverMsg}`);
          } else if (window?.showToast) {
            window.showToast(serverMsg, "error");
          }
        }

        return Promise.reject(error);
      }
    );
  }

  async refreshToken() {
    try {
      const currentToken = localStorage.getItem("token");
      if (!currentToken) {
        throw new Error("No token to refresh");
      }

      const backendUrl = import.meta.env.VITE_BACKEND_URL;

      // Make GET request to refresh token endpoint with timeout
      // No Authorization header needed - refresh token is stored in cookies
      const response = await axios.get(
        `${backendUrl}/api/Account/refresh-token`,
        {
          timeout: 10000, // 10 second timeout
          withCredentials: true, // Include cookies in the request
          // Prevent the global 401 interceptor from trying to refresh again
          // for this refresh-token call itself.
          skipAuthRefresh: true,
        }
      );

      // If response is not 200, it's considered a failure for refresh
      if (response.status !== 200) {
        throw new Error(`Refresh failed with status ${response.status}`);
      }

      // Extract response data
      const data = response?.data;

      // If backend wraps 401 in the body (statuscode / responseBody), treat it as auth failure
      const bodyStatusCode =
        data?.statuscode || data?.responseBody?.statuscode || data?.responseBody?.statusCode;
      const bodyMessage = data?.responseBody?.message || data?.message;

      if (
        bodyStatusCode === 401 ||
        bodyMessage === "Please login again"
      ) {
        this.redirectToLogin();

        const authError = new Error(bodyMessage || "Please login again");
        authError.response = {
          status: 401,
          data,
        };

        throw authError;
      }

      // Extract new token from response - try multiple possible formats
      const newToken =
        data?.token ||
        data?.accessToken ||
        data?.data?.token ||
        data?.data?.accessToken ||
        data?.responseBody?.data?.token ||
        data?.responseBody?.data?.accessToken ||
        (typeof data === "string" ? data : null);

      if (newToken && typeof newToken === "string" && newToken.length > 10) {
        return newToken;
      } else {
        throw new Error("Invalid token response format");
      }
    } catch (error) {
      // If refresh token request returns 400 or 401, treat it as unauthorized and force login again
      if (
        error.response?.status === 400 ||
        error.response?.status === 401
      ) {
        // Immediately redirect user to login
        this.redirectToLogin();

        // Normalize the error to look like a 401 for any callers
        const authError = new Error("Refresh token invalid or expired");
        authError.response = {
          ...(error.response || {}),
          status: 401,
        };

        throw authError;
      }

      // For any other error status, just rethrow the original error
      if (error.response?.status >= 400) {
        throw error;
      }

      throw error;
    }
  }

  processQueue(error, token = null) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token);
      }
    });

    this.failedQueue = [];
  }

  redirectToLogin() {
    // Clear token from localStorage
    localStorage.removeItem("token");

    // Show notification
    if (window.showToast) {
      window.showToast("Session expired. Please login again.", "error");
    } else {
      alert("Session expired. Please login again.");
    }

    // Redirect to login page
    setTimeout(() => {
      window.location.href = "/";
    }, 1000);
  }

  // Method to manually refresh token (can be called from components)
  async manualRefresh() {
    try {
      const newToken = await this.refreshToken();
      if (newToken) {
        localStorage.setItem("token", newToken);
        return newToken;
      }
      return null;
    } catch (error) {
      // If refresh token returns 400 or any error, redirect to login
      if (error.response?.status === 400 || error.response?.status >= 400) {
        this.redirectToLogin();
        return null;
      }

      this.redirectToLogin();
      return null;
    }
  }

  // Method to get current token
  getCurrentToken() {
    return localStorage.getItem("token");
  }

  // Method to check if token exists and looks valid (basic check without server validation)
  hasValidToken() {
    const token = localStorage.getItem("token");
    return token && token.length > 10; // Basic validation
  }

  // Method to test refresh token endpoint manually (for debugging)
  async testRefreshToken() {
    try {
      const currentToken = localStorage.getItem("token");
      if (!currentToken) {
        return false;
      }

      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      const response = await axios.get(
        `${backendUrl}/api/Account/refresh-token`,
        {
          timeout: 10000,
          withCredentials: true, // Include cookies in the request
        }
      );

      return true;
    } catch (error) {
      return false;
    }
  }

  // Method to force a 401 error for testing (for debugging)
  async triggerTest401() {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      // Make a request that should trigger 401
      await axios.get(`${backendUrl}/api/Order`, {
        headers: {
          Authorization: `Bearer invalid_token_for_testing`,
        },
      });
    } catch (error) {
      return error.response?.status === 401;
    }
  }

  // Method to check if cookies are being sent (for debugging)
  async checkCookies() {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      const response = await axios.get(
        `${backendUrl}/api/Account/refresh-token`,
        {
          withCredentials: true,
          timeout: 5000,
        }
      );
      return true;
    } catch (error) {
      return false;
    }
  }

  // Method to clear token and logout
  logout() {
    localStorage.removeItem("token");
    window.location.href = "/";
  }
}

// Create singleton instance
const authService = new AuthService();

export default authService;
