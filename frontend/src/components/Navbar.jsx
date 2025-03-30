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
  const mobileMenuRef = useRef(null);

  const handleLogout = async () => {
    try {
      await logout();
      setIsMobileMenuOpen(false); // Close mobile menu
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  // Close dropdown and mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (mobileMenuRef.current && 
          !mobileMenuRef.current.contains(event.target) && 
          !event.target.closest('.mobile-toggle')) {
        setIsMobileMenuOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Handle navigation and menu closing
  const handleNavigation = (path) => {
    navigate(path);
    setIsMobileMenuOpen(false);
    setShowDropdown(false);
  };

  // Determine if link is active
  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand" onClick={() => setIsMobileMenuOpen(false)}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="navbar-icon" viewBox="0 0 16 16">
            <path fillRule="evenodd" d="M6 2a.5.5 0 0 1 .47.33L10 12.036l1.53-4.208A.5.5 0 0 1 12 7.5h3.5a.5.5 0 0 1 0 1h-3.15l-1.88 5.17a.5.5 0 0 1-.94 0L6 3.964 4.47 8.171A.5.5 0 0 1 4 8.5H.5a.5.5 0 0 1 0-1h3.15l1.88-5.17A.5.5 0 0 1 6 2"/>
          </svg>
          ECGenius
        </Link>
        
        <button 
          className={`mobile-toggle ${isMobileMenuOpen ? 'open' : ''}`}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle navigation"
          aria-expanded={isMobileMenuOpen}
        >
          <span className="toggle-bar"></span>
          <span className="toggle-bar"></span>
          <span className="toggle-bar"></span>
        </button>

        <div className={`navbar-collapse ${isMobileMenuOpen ? 'show' : ''}`} ref={mobileMenuRef}>
          <ul className="navbar-nav">
            <li className="nav-item">
              <Link 
                to="/home" 
                className={`nav-link ${isActive('/home')}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Home
              </Link>
            </li>
            
            {user?.profile?.role === 'student' && (
              <li className="nav-item">
                <Link 
                  to="/quiz" 
                  className={`nav-link ${isActive('/quiz')}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Take Quiz
                </Link>
              </li>
            )}
            
            <li className="nav-item">
              <Link 
                to="/quiz-history" 
                className={`nav-link ${isActive('/quiz-history')}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                History
              </Link>
            </li>
            
            {user?.is_staff && (
              <li className="nav-item">
                <Link 
                  to="/admin" 
                  className={`nav-link ${isActive('/admin')}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Admin
                </Link>
              </li>
            )}
            
            {user?.profile?.role === 'teacher' && (
              <li className="nav-item">
                <Link 
                  to="/teacher" 
                  className={`nav-link ${isActive('/teacher')}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
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
                    <button onClick={() => handleNavigation('/profile')} className="dropdown-item">
                      <span className="dropdown-icon">👤</span> Profile
                    </button>
                    <button onClick={() => handleNavigation('/settings')} className="dropdown-item">
                      <span className="dropdown-icon">⚙️</span> Settings
                    </button>
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