import React, { createContext, useState, useContext, useEffect } from 'react';
import { getCsrfToken } from '../api/axiosInstance';
import * as authApi from '../api/authApi';

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
        await loadUserStatus();
      } catch (error) {
        console.error('Failed to initialize auth context:', error);
        setUser(null);
        setLoading(false);
      }
    };

    initialize();
  }, []);

  const loadUserStatus = async () => {
    try {
      const data = await authApi.checkUserStatus();
      setUser(data.user);
    } catch (error) {
      console.error('User status check failed:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (loginIdentifier, password) => {
    try {
      const data = await authApi.login(loginIdentifier, password);
      
      // Set the user data
      setUser(data.user);
      
      // Immediately fetch fresh user status to ensure we have complete profile data
      await loadUserStatus();
      
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
      setUser(null);
      return true;
    } catch (error) {
      console.error('Logout failed:', error);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ user, login: handleLogin, logout: handleLogout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext); 