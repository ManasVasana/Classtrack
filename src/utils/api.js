import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true, // ✅ still needed if your backend uses cookies for login/session
});

// Request interceptor: add access token to headers
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: just return or forward error — refresh token logic is disabled
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // 🔁 Refresh token logic disabled below

    /*
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const res = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/refresh-token`,
          {},
          { withCredentials: true }
        );

        const newToken = res.data.token;
        localStorage.setItem("token", newToken);

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        return Promise.reject("Unable to refresh token. Login again.");
      }
    }
    */

    return Promise.reject(error);
  }
);

export default api;
