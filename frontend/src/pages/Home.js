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
      </div>
      <div className="content">
        <div className="action-cards">
          {user.role === 'admin' && (
            <div className="card" onClick={() => navigate('/admin')}>
              <h3>Admin Dashboard</h3>
              <p>Access the admin dashboard to manage the system.</p>
            </div>
          )}
          <div className="card" onClick={() => navigate('/quiz')}>
            <h3>ECG Quiz</h3>
            <p>Test your ECG interpretation skills with our interactive quiz!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home; 