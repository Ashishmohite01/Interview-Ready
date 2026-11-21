import axios from "axios";

// Normalize API URL and remove any trailing slash
const rawApiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
export const API_BASE_URL = rawApiUrl.replace(/\/+$/, "");

export const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
});

// Request interceptor: attach JWT token from localStorage if available
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor: automatically clear token on 401 Unauthorized
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem("token");
        }
        return Promise.reject(error);
    }
);

export default api;

