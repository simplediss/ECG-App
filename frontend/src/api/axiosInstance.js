import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api';

const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 5000, // Optional: Set a request timeout
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
    },
});

// Add a request interceptor to get CSRF token if needed
axiosInstance.interceptors.request.use(async (config) => {
    // If we don't have a CSRF token, get one
    if (!axios.defaults.headers.common['X-CSRFToken']) {
        try {
            const response = await axios.get(`${API_BASE_URL}/auth/csrf/`, {
                withCredentials: true
            });
            axios.defaults.headers.common['X-CSRFToken'] = response.data.csrfToken;
        } catch (error) {
            console.error('Failed to fetch CSRF token:', error);
        }
    }
    
    // Add the CSRF token to the request headers
    config.headers['X-CSRFToken'] = axios.defaults.headers.common['X-CSRFToken'];
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default axiosInstance;
