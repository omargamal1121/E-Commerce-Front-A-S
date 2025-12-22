import axios from "axios";

class AuthService {
  constructor() {
    this.isRefreshing = false;
    this.failedQueue = [];
    this.setupInterceptors();
  }

  // Works with backend middleware that validates access tokens and stores refresh token in cookies
  setupInterceptors() {
    axios.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem("token");

        // Don't add Authorization header for refresh token requests
        if (token && !config.url?.includes("/api/Account/refresh-token")) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Ensure withCredentials is true for refresh token requests
        if (config.url?.includes("/api/Account/refresh-token")) {
          config.withCredentials = true;
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (!originalRequest) return Promise.reject(error);

        // If status is 401 Unauthorized
        if (error.response?.status === 401) {

          // If the request that failed WAS the refresh token request, we must login again
          if (originalRequest.url?.includes("/api/Account/refresh-token")) {
            this.logout();
            return Promise.reject(error);
          }

          // If we already tried to retry this request once, don't try again
          if (originalRequest._retry) {
            this.logout();
            return Promise.reject(error);
          }

          // If another request is currently refreshing the token, add this request to the queue
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then((token) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return axios(originalRequest);
              })
              .catch((err) => Promise.reject(err));
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const newToken = await this.refreshToken();
            if (newToken) {
              localStorage.setItem("token", newToken);

              // Update default headers for subsequent requests
              axios.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
              originalRequest.headers.Authorization = `Bearer ${newToken}`;

              this.processQueue(null, newToken);
              return axios(originalRequest);
            }
            throw new Error("Could not extract new token");
          } catch (refreshError) {
            this.processQueue(refreshError, null);
            this.logout();
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  async refreshToken() {
    try {
      // Cookie-based refresh, no Authorization header; include cookies
      const response = await axios.get(
        "https://fashion-v1.runasp.net/api/Account/refresh-token",
        {
          withCredentials: true,
          timeout: 10000,
          // Avoid the interceptor if it adds Authorization or catches 401 again (handled in setupInterceptors)
        }
      );

      const data = response?.data;
      const newToken =
        data?.token ||
        data?.accessToken ||
        data?.data?.token ||
        data?.data?.accessToken ||
        data?.responseBody?.data?.token ||
        data?.responseBody?.data?.accessToken ||
        (typeof data === "string" ? data : null);

      if (newToken && typeof newToken === "string" && newToken.length > 20) {
        console.log("✅ Token refreshed successfully");
        return newToken;
      }
      throw new Error("Invalid token response format");
    } catch (error) {
      console.error("❌ Refresh token failed:", error);
      throw error;
    }
  }

  processQueue(error, token = null) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) reject(error);
      else resolve(token);
    });
    this.failedQueue = [];
  }

  logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    delete axios.defaults.headers.common["Authorization"];

    // Redirect only if not already on login page
    if (window.location.pathname !== "/login") {
      setTimeout(() => {
        window.location.href = "/login";
      }, 100);
    }
  }

  hasValidToken() {
    const token = localStorage.getItem("token");
    return token && token.length > 20;
  }

  initiateGoogleLogin() {
    const backendUrl = "https://fashion-v1.runasp.net";
    const returnUrl = `${window.location.origin}/google-callback`;
    window.location.href = `${backendUrl}/api/ExternalLogin/Login?provider=Google&returnUrl=${encodeURIComponent(returnUrl)}`;
  }
}

const authService = new AuthService();
export default authService;



