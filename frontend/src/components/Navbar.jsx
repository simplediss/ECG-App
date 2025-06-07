import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import '../styles/components/Navbar.css';

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
            
            {(user?.profile?.role === 'teacher' || user?.is_staff) && (
              <li className="nav-item">
                <Link 
                  to="/validation" 
                  className={`nav-link ${isActive('/validation')}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Validation
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
            
            <li className="nav-item">
              <Link 
                to="/groups" 
                className={`nav-link ${isActive('/groups')}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Groups
              </Link>
            </li>
          </ul>
          
          <div className="navbar-right">
            <div className="theme-switch-wrapper">
              <label className="theme-switch" htmlFor="theme-checkbox">
                <input 
                  type="checkbox" 
                  id="theme-checkbox" 
                  checked={darkMode}
                  onChange={toggleDarkMode}
                  aria-label="Toggle dark mode"
                />
                <div className="slider">
                  <div className="slider-icon light">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
                      <path d="M8 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0zm0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13zm8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5zM3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8zm10.657-5.657a.5.5 0 0 1 0 .707l-1.414 1.415a.5.5 0 1 1-.707-.708l1.414-1.414a.5.5 0 0 1 .707 0zm-9.193 9.193a.5.5 0 0 1 0 .707L3.05 13.657a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0zm9.193 2.121a.5.5 0 0 1-.707 0l-1.414-1.414a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707zM4.464 4.465a.5.5 0 0 1-.707 0L2.343 3.05a.5.5 0 1 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .708z"/>
                    </svg>
                  </div>
                  <div className="slider-icon dark">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 16 16">
                      <path d="M6 .278a.768.768 0 0 1 .08.858 7.208 7.208 0 0 0-.878 3.46c0 4.021 3.278 7.277 7.318 7.277.527 0 1.04-.055 1.533-.16a.787.787 0 0 1 .81.316.733.733 0 0 1-.031.893A8.349 8.349 0 0 1 8.344 16C3.734 16 0 12.286 0 7.71 0 4.266 2.114 1.312 5.124.06A.752.752 0 0 1 6 .278z"/>
                    </svg>
                  </div>
                </div>
              </label>
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
                      <span className="dropdown-icon">⚙️</span> Profile
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