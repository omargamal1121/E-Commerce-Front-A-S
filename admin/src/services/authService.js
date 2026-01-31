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
        console.log("🔍 Interceptor caught error:", {
          status: error.response?.status,
          url: error.config?.url,
          message: error.message,
        });

        const originalRequest = error.config;

        // 🟥 Handle 409 Conflict (e.g., product with same name)
        if (error.response?.status === 409) {
          const serverMsg =
            error.response?.data?.message ||
            error.response?.data?.errors?.messages?.[0] ||
            "Conflict error (resource already exists).";

          console.warn("⚠️ Conflict detected:", serverMsg);

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
          if (!existingToken) return Promise.reject(error);

          console.log("🔄 401 detected, attempting token refresh...");

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
              console.log("✅ Token refresh successful, retrying request");
              localStorage.setItem("token", newToken);
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              this.processQueue(null, newToken);
              return axios(originalRequest);
            } else {
              console.log("❌ Token refresh failed, redirecting to login");
              this.processQueue(new Error("Token refresh failed"), null);
              this.redirectToLogin();
              return Promise.reject(error);
            }
          } catch (refreshError) {
            console.error("❌ Token refresh error:", refreshError);
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

          console.warn(`⚠️ API Error (${error.response?.status || 'Network'}):`, serverMsg);

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

      console.log("🔄 Attempting to refresh token...");
      console.log(
        "🔄 Current token (first 20 chars):",
        currentToken.substring(0, 20) + "..."
      );
      console.log("🔄 Using cookie-based refresh token from server...");

      // Make GET request to refresh token endpoint with timeout
      // No Authorization header needed - refresh token is stored in cookies
      const response = await axios.get(
        "https://fashion-v1.runasp.net/api/Account/refresh-token",
        {
          timeout: 10000, // 10 second timeout
          withCredentials: true, // Include cookies in the request
        }
      );

      console.log("🔄 Refresh response status:", response.status);
      console.log("🔄 Refresh response data:", response.data);

      // Extract new token from response - try multiple possible formats
      const newToken =
        response?.data?.token ||
        response?.data?.accessToken ||
        response?.data?.data?.token ||
        response?.data?.data?.accessToken ||
        response?.data?.responseBody?.data?.token ||
        response?.data?.responseBody?.data?.accessToken ||
        response?.data;

      console.log(
        "🔄 Extracted token:",
        newToken ? newToken.substring(0, 20) + "..." : "null"
      );

      if (newToken && typeof newToken === "string" && newToken.length > 10) {
        console.log("✅ Token refreshed successfully");
        return newToken;
      } else {
        console.error("❌ Invalid token response format:", response.data);
        console.error("❌ Token type:", typeof newToken);
        console.error("❌ Token length:", newToken?.length);
        throw new Error("Invalid token response format");
      }
    } catch (error) {
      console.error("❌ Token refresh failed:", error.message);
      console.error("❌ Error response:", error.response?.data);
      console.error("❌ Error status:", error.response?.status);

      // If refresh token request returns 400 or any error, it means refresh failed
      if (error.response?.status === 400 || error.response?.status >= 400) {
        console.log("❌ Refresh token is invalid or expired");
        throw new Error("Refresh token failed - redirecting to login");
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
        console.log("❌ Manual refresh failed - token invalid/expired");
        this.redirectToLogin();
        return null;
      }

      console.error("❌ Manual refresh error:", error);
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
        console.log("❌ No token to test refresh");
        return false;
      }

      console.log("🧪 Testing refresh token endpoint...");

      const response = await axios.get(
        "https://fashion-v1.runasp.net/api/Account/refresh-token",
        {
          timeout: 10000,
          withCredentials: true, // Include cookies in the request
        }
      );

      console.log("🧪 Test refresh response:", response.data);
      return true;
    } catch (error) {
      console.error(
        "🧪 Test refresh failed:",
        error.response?.data || error.message
      );
      console.error("🧪 Error status:", error.response?.status);
      return false;
    }
  }

  // Method to force a 401 error for testing (for debugging)
  async triggerTest401() {
    try {
      console.log("🧪 Triggering test 401 error...");
      // Make a request that should trigger 401
      await axios.get("https://fashion-v1.runasp.net/api/Order", {
        headers: {
          Authorization: `Bearer invalid_token_for_testing`,
        },
      });
    } catch (error) {
      console.log("🧪 Test 401 triggered:", error.response?.status);
      return error.response?.status === 401;
    }
  }

  // Method to check if cookies are being sent (for debugging)
  async checkCookies() {
    try {
      console.log("🍪 Checking if cookies are being sent...");
      const response = await axios.get(
        "https://fashion-v1.runasp.net/api/Account/refresh-token",
        {
          withCredentials: true,
          timeout: 5000,
        }
      );
      console.log("🍪 Cookie request successful:", response.status);
      return true;
    } catch (error) {
      console.log("🍪 Cookie request failed:", error.response?.status);
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
