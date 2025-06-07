import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/pages/Home.css';
import UserStatistics from '../components/statistics/UserStatistics';
import StreakCounter from '../components/StreakCounter';
import { Container, Box, Grid } from '@mui/material';

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
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 17) return 'Good afternoon';
    if (hour >= 17 && hour < 22) return 'Good evening';
    return 'Good night';
  };

  return (
    <Container maxWidth="lg">
      <div className="page-container">
        <div className="home-hero">
          <div className="hero-content">
            <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', width: '100%', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
              <Box>
                <h1>
                  <span className="welcome-text">{getWelcomeMessage()},</span>
                  <span className="username">{user.first_name || user.username}</span>
                </h1>
                <p className="hero-subtitle">Ready to improve your ECG interpretation skills?</p>
              </Box>
              {user.profile?.role === 'student' && (
                <StreakCounter />
              )}
            </Box>
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
          </div>
        </section>

        {user.profile?.role === 'student' && (
          <section className="section">
            <h2 className="section-title">Statistics</h2>
            <UserStatistics 
              userId={user.id} 
              title="Your Statistics" 
            />
          </section>
        )}
      </div>
    </Container>
  );
};

export default Home; 