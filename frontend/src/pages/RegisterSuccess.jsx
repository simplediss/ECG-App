import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Login.css'; // Reuse login styles

const RegisterSuccess = () => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);

  // Automatically redirect to login page after countdown
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/login');
    }, 5000);

    // Countdown effect
    const interval = setInterval(() => {
      setCountdown(prev => prev - 1);
    }, 1000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [navigate]);

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
          <div className="success-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="#28a745" className="bi bi-check-circle-fill" viewBox="0 0 16 16">
              <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
            </svg>
          </div>
          <h2>Registration Successful!</h2>
          <p className="auth-subtitle">Your account has been created successfully.</p>
        </div>
        
        <div className="success-message">
          <p>You will be redirected to the login page in {countdown} seconds...</p>
          <p>Please log in with your new credentials to access your account.</p>
        </div>
        
        <Link to="/login" className="btn btn-primary btn-block">
          Login Now
        </Link>
        
        <div className="auth-footer">
          <p>
            Welcome to ECGenius. Thank you for registering!
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterSuccess; 