import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import '../styles/Login.css'; // Reuse login styles

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
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Validate username
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }
    
    // Validate email
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    // Validate password
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    // Validate confirm password
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    // Validate first name
    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }
    
    // Validate last name
    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }
    
    // Validate date of birth
    if (!formData.date_of_birth) {
      newErrors.date_of_birth = 'Date of birth is required';
    }
    
    // Validate gender
    if (!formData.gender) {
      newErrors.gender = 'Please select your gender';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!validateForm()) {
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

      const response = await axiosInstance.post(`/register/`, userData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data) {
        navigate('/register-success');
      }
    } catch (err) {
      console.error('Registration error:', err.response?.data || err);
      
      // Handle different types of error responses
      if (err.response?.data) {
        const serverErrors = err.response.data;
        console.log("Server errors:", serverErrors);
        
        const fieldErrors = {};
        
        // Check if the response has an errors object (from the screenshot format)
        if (serverErrors.errors) {
          // Process each field in the errors object
          Object.entries(serverErrors.errors).forEach(([key, value]) => {
            if (Array.isArray(value) && value.length > 0) {
              fieldErrors[key] = value[0];
            } else {
              fieldErrors[key] = value;
            }
          });
        } 
        // Also check for direct field errors at the top level (previous format)
        else if (typeof serverErrors === 'object') {
          // Process all field errors
          Object.entries(serverErrors).forEach(([key, value]) => {
            // Handle ErrorDetail objects that have string property
            if (value && (Array.isArray(value) || typeof value === 'object')) {
              // For array of ErrorDetail objects (Django REST framework format)
              if (Array.isArray(value)) {
                const errorMessage = value[0];
                // Handle both string errors and ErrorDetail objects
                fieldErrors[key] = typeof errorMessage === 'string' 
                  ? errorMessage 
                  : (errorMessage.string || errorMessage.message || JSON.stringify(errorMessage));
              } else {
                // For single ErrorDetail object
                fieldErrors[key] = value.string || value.message || JSON.stringify(value);
              }
            } else {
              // Simple string error
              fieldErrors[key] = value;
            }
          });
        }
        
        // Check for message in data
        if (serverErrors.message && !fieldErrors.general) {
          fieldErrors.general = serverErrors.message;
        }
        
        // If we have any field errors, set them
        if (Object.keys(fieldErrors).length > 0) {
          setErrors(fieldErrors);
        } else if (typeof serverErrors === 'string') {
          // Handle string error response
          setErrors({ general: serverErrors });
        } else {
          // Fallback generic error message
          setErrors({ general: 'Registration failed. Please try again.' });
        }
      } else {
        setErrors({ general: 'Network error. Please check your connection and try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Style for required field marker
  const requiredStyle = { color: '#e74c3c' };

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
        
        {errors.general && (
          <div className="alert alert-danger" role="alert">
            {errors.general}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="username" className="form-label">
                Username <span style={requiredStyle}>*</span>
              </label>
              <input
                type="text"
                id="username"
                name="username"
                className={`form-control ${errors.username ? 'is-invalid' : ''}`}
                value={formData.username}
                onChange={handleChange}
                placeholder="Choose a username"
                required
              />
              {errors.username && <div className="invalid-feedback">{errors.username}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email <span style={requiredStyle}>*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                value={formData.email}
                onChange={handleChange}
                placeholder="Your email address"
                required
              />
              {errors.email && <div className="invalid-feedback">{errors.email}</div>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password <span style={requiredStyle}>*</span>
              </label>
              <input
                type="password"
                id="password"
                name="password"
                className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a password"
                required
              />
              {errors.password && <div className="invalid-feedback">{errors.password}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">
                Confirm Password <span style={requiredStyle}>*</span>
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                required
              />
              {errors.confirmPassword && <div className="invalid-feedback">{errors.confirmPassword}</div>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="first_name" className="form-label">
                First Name <span style={requiredStyle}>*</span>
              </label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                className={`form-control ${errors.first_name ? 'is-invalid' : ''}`}
                value={formData.first_name}
                onChange={handleChange}
                placeholder="Your first name"
                required
              />
              {errors.first_name && <div className="invalid-feedback">{errors.first_name}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="last_name" className="form-label">
                Last Name <span style={requiredStyle}>*</span>
              </label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                className={`form-control ${errors.last_name ? 'is-invalid' : ''}`}
                value={formData.last_name}
                onChange={handleChange}
                placeholder="Your last name"
                required
              />
              {errors.last_name && <div className="invalid-feedback">{errors.last_name}</div>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="date_of_birth" className="form-label">
                Date of Birth <span style={requiredStyle}>*</span>
              </label>
              <input
                type="date"
                id="date_of_birth"
                name="date_of_birth"
                className={`form-control ${errors.date_of_birth ? 'is-invalid' : ''}`}
                value={formData.date_of_birth}
                onChange={handleChange}
                required
              />
              {errors.date_of_birth && <div className="invalid-feedback">{errors.date_of_birth}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="gender" className="form-label">
                Gender <span style={requiredStyle}>*</span>
              </label>
              <select 
                id="gender"
                name="gender" 
                className={`form-control ${errors.gender ? 'is-invalid' : ''}`}
                value={formData.gender} 
                onChange={handleChange}
                required
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              {errors.gender && <div className="invalid-feedback">{errors.gender}</div>}
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