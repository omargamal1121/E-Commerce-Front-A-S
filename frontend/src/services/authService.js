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
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config || {};
        const status = error.response?.status;

        if (status === 401 && !originalRequest._retry) {
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
              originalRequest.headers = originalRequest.headers || {};
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              this.processQueue(null, newToken);
              return axios(originalRequest);
            }
            this.processQueue(new Error("Token refresh failed"), null);
            this.redirectToLogin();
            return Promise.reject(error);
          } catch (refreshError) {
            this.processQueue(refreshError, null);
            this.redirectToLogin();
            return Promise.reject(error);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  async refreshToken() {
    const currentToken = localStorage.getItem("token");
    if (!currentToken) throw new Error("No token to refresh");

    // Cookie-based refresh, no Authorization header; include cookies
    const response = await axios.get(
      "https://fashion-v1.runasp.net/api/Account/refresh-token",
      {
        withCredentials: true,
        timeout: 10000,
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
      data;

    if (newToken && typeof newToken === "string" && newToken.length > 10) {
      return newToken;
    }
    throw new Error("Invalid token response format");
  }

  processQueue(error, token = null) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) reject(error);
      else resolve(token);
    });
    this.failedQueue = [];
  }

  redirectToLogin() {
    localStorage.removeItem("token");
    setTimeout(() => {
      window.location.href = "/login";
    }, 500);
  }

  getCurrentToken() {
    return localStorage.getItem("token");
  }

  hasValidToken() {
    const token = localStorage.getItem("token");
    return token && token.length > 10;
  }

  initiateGoogleLogin() {
    const backendUrl = "https://fashion-v1.runasp.net"; // Or import from config/context
    const returnUrl = `${window.location.origin}/google-callback`;
    window.location.href = `${backendUrl}/api/ExternalLogin/Login?provider=Google&returnUrl=${encodeURIComponent(returnUrl)}`;
  }
}

const authService = new AuthService();
export default authService;


