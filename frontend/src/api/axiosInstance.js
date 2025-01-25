import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 5000, // Optional: Set a request timeout
    headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
    },
});

export default axiosInstance;
