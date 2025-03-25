import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

// Configure axios defaults
axios.defaults.withCredentials = true;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get CSRF token when the app starts
    const getCsrfToken = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/auth/csrf/', {
          withCredentials: true
        });
        // Set the CSRF token in axios defaults
        axios.defaults.headers.common['X-CSRFToken'] = response.data.csrfToken;
      } catch (error) {
        console.error('Failed to get CSRF token:', error);
      }
    };
    getCsrfToken();
    checkUserStatus();
  }, []);

  const checkUserStatus = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/auth/user-status/', {
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
      const response = await axios.post('http://localhost:8000/api/auth/login/', {
        username,
        password
      }, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        }
      });
      setUser(response.data.user);
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      // Get a fresh CSRF token before logout
      const csrfResponse = await axios.get('http://localhost:8000/api/auth/csrf/', {
        withCredentials: true
      });
      
      await axios.post('http://localhost:8000/api/auth/logout/', {}, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfResponse.data.csrfToken
        }
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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 