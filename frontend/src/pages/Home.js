import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Home.css';

const Home = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const success = await logout();
    if (success) {
      navigate('/login');
    }
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="home-container">
      <div className="header">
        <h1>Welcome, {user.username}!</h1>
        <div className="header-buttons">
          {user.role === 'admin' && (
            <button 
              onClick={() => navigate('/admin')} 
              className="admin-button"
            >
              Admin Dashboard
            </button>
          )}
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>
      </div>
      <div className="content">
        <p>You are successfully logged in.</p>
      </div>
    </div>
  );
};

export default Home; 