import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

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

// Helper for getting image URLs with the correct base
export const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path; // Already a full URL

    // If we're in development mode, use the API base URL
    if (process.env.REACT_APP_DEBUG === 'true') {
        return `${API_BASE_URL}/images/${encodeURIComponent(path)}`;
    }
    
    // Remove any leading slashes and 'dataset/' prefix if present
    const cleanPath = path.replace(/^\/?(dataset\/)?/, '');
    
    // Join path segments without encoding slashes
    return `/ecg-images/${cleanPath}`;
};

export default axiosInstance;
