import React, { createContext, useState, useContext, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const getCsrfToken = async () => {
    try {
      const response = await axiosInstance.get(`/auth/csrf/`, {
        withCredentials: true
      });
      // Set the CSRF token in axios defaults
      axiosInstance.defaults.headers.common['X-CSRFToken'] = response.data.csrfToken;
      return response.data.csrfToken;
    } catch (error) {
      console.error('Failed to get CSRF token:', error);
      return null;
    }
  };

  useEffect(() => {
    getCsrfToken();
    checkUserStatus();
  }, []);

  const checkUserStatus = async () => {
    try {
      const response = await axiosInstance.get(`/auth/user-status/`, {
        withCredentials: true
      });
      setUser(response.data.user);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      // Get a fresh CSRF token before login
      const csrfToken = await getCsrfToken();
      
      const response = await axiosInstance.post(`/auth/login/`, {
        username,
        password
      }, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken
        }
      });

      // Get a fresh CSRF token after successful login
      const newCsrfToken = await getCsrfToken();
      if (newCsrfToken) {
        axiosInstance.defaults.headers.common['X-CSRFToken'] = newCsrfToken;
      }

      // Set the user data
      setUser(response.data.user);
      
      // Immediately fetch fresh user status to ensure we have complete profile data
      await checkUserStatus();
      
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      // Get a fresh CSRF token before logout
      const csrfToken = await getCsrfToken();
      
      await axiosInstance.post(`/auth/logout/`, {}, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken
        }
      });
      
      // Clear the CSRF token from axios defaults
      delete axiosInstance.defaults.headers.common['X-CSRFToken'];
      setUser(null);
      return true;
    } catch (error) {
      console.error('Logout failed:', error);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 