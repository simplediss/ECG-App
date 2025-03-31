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

// Store the CSRF token in memory
let csrfToken = null;

// Function to get CSRF token
const getCsrfToken = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/auth/csrf/`, {
            withCredentials: true
        });
        return response.data.csrfToken;
    } catch (error) {
        console.error('Failed to fetch CSRF token:', error);
        return null;
    }
};

// Add a request interceptor to get CSRF token if needed
axiosInstance.interceptors.request.use(async (config) => {
    // If we don't have a CSRF token in memory, get one
    if (!csrfToken) {
        csrfToken = await getCsrfToken();
    }
    
    // Add the CSRF token to the request headers
    if (csrfToken) {
        config.headers['X-CSRFToken'] = csrfToken;
    }
    
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Add a response interceptor to handle token refresh on 403 errors
axiosInstance.interceptors.response.use(
    response => response,
    async error => {
        const originalRequest = error.config;
        
        // If it's a 403 error and we haven't already tried to refresh the token
        if (error.response && error.response.status === 403 && !originalRequest._retry) {
            originalRequest._retry = true;
            
            // Try to get a new CSRF token
            csrfToken = await getCsrfToken();
            
            if (csrfToken) {
                // Update the request with the new token
                originalRequest.headers['X-CSRFToken'] = csrfToken;
                return axiosInstance(originalRequest);
            }
        }
        
        return Promise.reject(error);
    }
);

// Helper for getting image URLs with the correct base
export const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path; // Already a full URL

    // Clean the path by removing leading slashes and dataset/ prefix
    const cleanPath = path.replace(/^\/?(dataset\/)?/, '');

    // If we're in development mode, use the API base URL
    if (process.env.REACT_APP_DEBUG === 'true') {
        return `${API_BASE_URL}/images/${encodeURIComponent(cleanPath)}`;
    }
    
    // Join path segments without encoding slashes
    return `/ecg-images/${cleanPath}`;
};

// Export the getCsrfToken function for direct use
export { getCsrfToken };

export default axiosInstance;
