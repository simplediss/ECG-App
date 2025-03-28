import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/" className="navbar-title">
          ECG Master
        </Link>
      </div>
      <div className="navbar-links">
        <Link to="/profile" className="nav-link">
          Profile
        </Link>
        <Link to="/quiz-history" className="nav-link">
          Quiz History
        </Link>

        {user?.is_staff && (
          <Link to="/admin" className="nav-link">
            Admin Dashboard
          </Link>
        )}
        
        {user?.profile?.role === 'teacher' && (
          <Link to="/teacher" className="nav-link">
            Teacher Dashboard
          </Link>
        )}

        {user?.profile?.role === 'student' && (
          <Link to="/quiz" className="nav-link">
            Take Quiz
          </Link>
        )}

        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar; 