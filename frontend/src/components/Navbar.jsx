import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Determine if link is active
  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <span className="navbar-icon">❤️</span>
          ECG Master
        </Link>
        
        <button 
          className={`mobile-toggle ${isMobileMenuOpen ? 'open' : ''}`}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle navigation"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <div className={`navbar-collapse ${isMobileMenuOpen ? 'show' : ''}`}>
          <ul className="navbar-nav">
            <li className="nav-item">
              <Link to="/home" className={`nav-link ${isActive('/home')}`}>
                Home
              </Link>
            </li>
            
            {user?.profile?.role === 'student' && (
              <li className="nav-item">
                <Link to="/quiz" className={`nav-link ${isActive('/quiz')}`}>
                  Take Quiz
                </Link>
              </li>
            )}
            
            <li className="nav-item">
              <Link to="/quiz-history" className={`nav-link ${isActive('/quiz-history')}`}>
                History
              </Link>
            </li>
            
            {user?.is_staff && (
              <li className="nav-item">
                <Link to="/admin" className={`nav-link ${isActive('/admin')}`}>
                  Admin
                </Link>
              </li>
            )}
            
            {user?.profile?.role === 'teacher' && (
              <li className="nav-item">
                <Link to="/teacher" className={`nav-link ${isActive('/teacher')}`}>
                  Teacher
                </Link>
              </li>
            )}
            
            <li className="nav-item">
              <Link to="/groups" className={`nav-link ${isActive('/groups')}`}>
                Groups
              </Link>
            </li>
          </ul>
          
          <div className="navbar-right">
            <div className="theme-switch-wrapper">
              <span className="theme-switch-icon">🌙</span>
              <label className="theme-switch" htmlFor="theme-checkbox">
                <input 
                  type="checkbox" 
                  id="theme-checkbox" 
                  checked={darkMode}
                  onChange={toggleDarkMode}
                  aria-label="Toggle dark mode"
                />
                <span className="slider round">
                  <span className="sr-only">
                    {darkMode ? "Switch to light mode" : "Switch to dark mode"}
                  </span>
                </span>
              </label>
              <span className="theme-switch-icon">☀️</span>
            </div>
            
            {user && (
              <div className="user-menu" ref={dropdownRef}>
                <button 
                  className="user-toggle" 
                  onClick={() => setShowDropdown(!showDropdown)}
                >
                  <span className="avatar">
                    {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
                  </span>
                  <span className="username">{user.username}</span>
                  <span className="dropdown-icon">▼</span>
                </button>
                
                {showDropdown && (
                  <div className="dropdown-menu">
                    <Link to="/profile" className="dropdown-item">
                      <span className="dropdown-icon">👤</span> Profile
                    </Link>
                    <Link to="/settings" className="dropdown-item">
                      <span className="dropdown-icon">⚙️</span> Settings
                    </Link>
                    <div className="dropdown-divider"></div>
                    <button onClick={handleLogout} className="dropdown-item text-danger">
                      <span className="dropdown-icon">🚪</span> Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 