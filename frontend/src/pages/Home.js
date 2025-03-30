import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Home.css';

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    navigate('/login');
    return null;
  }

  // Create welcome message based on time of day
  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="page-container">
      <div className="home-hero">
        <div className="hero-content">
          <h1>
            <span className="welcome-text">{getWelcomeMessage()},</span>
            <span className="username">{user.username}</span>
          </h1>
          <p className="hero-subtitle">Ready to improve your ECG interpretation skills?</p>
        </div>
      </div>

      <section className="section">
        <h2 className="section-title">Quick Actions</h2>
        <div className="card-grid">
          {user.profile?.role === 'student' && (
            <div className="feature-card" onClick={() => navigate('/quiz')}>
              <div className="card-icon">📝</div>
              <h3>Take a Quiz</h3>
              <p>Test your ECG interpretation skills with interactive quizzes</p>
              <button className="btn btn-primary">Start Quiz</button>
            </div>
          )}
          
          <div className="feature-card" onClick={() => navigate('/groups')}>
            <div className="card-icon">👥</div>
            <h3>Groups</h3>
            <p>Study groups allows collaborate with other students</p>
            <button className="btn btn-primary">View Groups</button>
          </div>
          
          {user.is_staff && (
            <div className="feature-card" onClick={() => navigate('/admin')}>
              <div className="card-icon">⚙️</div>
              <h3>Admin Dashboard</h3>
              <p>Manage users, ECG samples, and view system statistics</p>
              <button className="btn btn-primary">Go to Dashboard</button>
            </div>
          )}
          
          {user.profile?.role === 'teacher' && (
            <div className="feature-card" onClick={() => navigate('/teacher')}>
              <div className="card-icon">👨‍🏫</div>
              <h3>Teacher Dashboard</h3>
              <p>Manage student progress and create educational materials</p>
              <button className="btn btn-primary">Go to Dashboard</button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home; 