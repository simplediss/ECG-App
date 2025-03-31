import React, { createContext, useState, useContext, useEffect } from 'react';
import axiosInstance, { getCsrfToken } from '../api/axiosInstance';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize by getting CSRF token and checking user status
    const initialize = async () => {
      try {
        // Get CSRF token first
        await getCsrfToken();
        // Check user status
        await checkUserStatus();
      } catch (error) {
        console.error('Failed to initialize auth context:', error);
        setUser(null);
        setLoading(false);
      }
    };

    initialize();
  }, []);

  const checkUserStatus = async () => {
    try {
      const response = await axiosInstance.get(`/auth/user-status/`, {
        withCredentials: true
      });
      setUser(response.data.user);
    } catch (error) {
      console.error('User status check failed:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      // Get a fresh CSRF token before login
      await getCsrfToken();
      
      const response = await axiosInstance.post(`/auth/login/`, {
        username,
        password
      }, {
        withCredentials: true
      });

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
      await getCsrfToken();
      
      await axiosInstance.post(`/auth/logout/`, {}, {
        withCredentials: true
      });
      
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

export const useAuth = () => useContext(AuthContext); 