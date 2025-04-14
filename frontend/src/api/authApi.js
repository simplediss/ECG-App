import axiosInstance, { getCsrfToken } from './axiosInstance';

// Check user authentication status
export const checkUserStatus = async () => {
  try {
    const response = await axiosInstance.get(`/auth/user-status/`, {
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Login user
export const login = async (loginIdentifier, password) => {
  try {
    // Get a fresh CSRF token before login
    await getCsrfToken();
    
    const response = await axiosInstance.post(`/auth/login/`, {
      login_identifier: loginIdentifier,
      password
    }, {
      withCredentials: true
    });
    
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Logout user
export const logout = async () => {
  try {
    // Get a fresh CSRF token before logout
    await getCsrfToken();
    
    const response = await axiosInstance.post(`/auth/logout/`, {}, {
      withCredentials: true
    });
    
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Request password reset
export const requestPasswordReset = async (email) => {
  try {
    await getCsrfToken();
    
    const response = await axiosInstance.post(`/auth/password-reset/`, {
      email
    }, {
      withCredentials: true
    });
    
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Confirm password reset
export const confirmPasswordReset = async (uid, token, newPassword) => {
  try {
    await getCsrfToken();
    
    const response = await axiosInstance.post(`/auth/password-reset/confirm/`, {
      uid,
      token,
      password: newPassword
    }, {
      withCredentials: true
    });
    
    return response.data;
  } catch (error) {
    throw error;
  }
}; 