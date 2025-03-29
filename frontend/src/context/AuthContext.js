import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/api';

// Configure axios defaults
axios.defaults.withCredentials = true;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const getCsrfToken = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/csrf/`, {
        withCredentials: true
      });
      // Set the CSRF token in axios defaults
      axios.defaults.headers.common['X-CSRFToken'] = response.data.csrfToken;
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
      const response = await axios.get(`${API_BASE_URL}/auth/user-status/`, {
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
      
      const response = await axios.post(`${API_BASE_URL}/auth/login/`, {
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
        axios.defaults.headers.common['X-CSRFToken'] = newCsrfToken;
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
      
      await axios.post(`${API_BASE_URL}/auth/logout/`, {}, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken
        }
      });
      
      // Clear the CSRF token from axios defaults
      delete axios.defaults.headers.common['X-CSRFToken'];
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