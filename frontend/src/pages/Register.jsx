import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Login.css'; // Reuse login styles

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/api';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      const userData = new FormData();
      
      // Add user fields
      userData.append('username', formData.username);
      userData.append('password', formData.password);
      userData.append('email', formData.email);
      userData.append('first_name', formData.first_name);
      userData.append('last_name', formData.last_name);
      
      // Add profile fields
      userData.append('date_of_birth', formData.date_of_birth);
      userData.append('gender', formData.gender);

      const response = await axios.post(`${API_BASE_URL}/register/`, userData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data) {
        navigate('/login');
      }
    } catch (err) {
      console.error('Registration error:', err.response?.data || err);
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.errors || 
                          'Registration failed. Please try again.';
      setError(typeof errorMessage === 'object' ? JSON.stringify(errorMessage) : errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <div className="logo-container">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" className="logo-icon activity-icon" viewBox="0 0 16 16">
                <path fillRule="evenodd" d="M6 2a.5.5 0 0 1 .47.33L10 12.036l1.53-4.208A.5.5 0 0 1 12 7.5h3.5a.5.5 0 0 1 0 1h-3.15l-1.88 5.17a.5.5 0 0 1-.94 0L6 3.964 4.47 8.171A.5.5 0 0 1 4 8.5H.5a.5.5 0 0 1 0-1h3.15l1.88-5.17A.5.5 0 0 1 6 2"/>
              </svg>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="logo-icon heart-icon" viewBox="0 0 16 16">
                <path fillRule="evenodd" d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314"/>
              </svg>
            </div>
            <h1>ECGenius</h1>
          </div>
          <h2>Create Account</h2>
          <p className="auth-subtitle">Fill in your details to get started</p>
        </div>
        
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="username" className="form-label">Username *</label>
              <input
                type="text"
                id="username"
                name="username"
                className="form-control"
                value={formData.username}
                onChange={handleChange}
                placeholder="Choose a username"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email" className="form-label">Email *</label>
              <input
                type="email"
                id="email"
                name="email"
                className="form-control"
                value={formData.email}
                onChange={handleChange}
                placeholder="Your email address"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password" className="form-label">Password *</label>
              <input
                type="password"
                id="password"
                name="password"
                className="form-control"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a password"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">Confirm Password *</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                className="form-control"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="first_name" className="form-label">First Name</label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                className="form-control"
                value={formData.first_name}
                onChange={handleChange}
                placeholder="Your first name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="last_name" className="form-label">Last Name</label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                className="form-control"
                value={formData.last_name}
                onChange={handleChange}
                placeholder="Your last name"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="date_of_birth" className="form-label">Date of Birth</label>
              <input
                type="date"
                id="date_of_birth"
                name="date_of_birth"
                className="form-control"
                value={formData.date_of_birth}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="gender" className="form-label">Gender</label>
              <select 
                id="gender"
                name="gender" 
                className="form-control"
                value={formData.gender} 
                onChange={handleChange}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-block"
            disabled={isLoading}
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
        
        <div className="auth-footer">
          <p>
            Already have an account? <Link to="/login" className="auth-link">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register; 