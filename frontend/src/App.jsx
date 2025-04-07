import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Login from './pages/Login';
import Register from './pages/Register';
import RegisterSuccess from './pages/RegisterSuccess';
import Home from './pages/Home';
import AdminDashboard from './pages/AdminDashboard';
import Quiz from './components/Quiz';
import QuizHistory from './pages/QuizHistory';
import QuizReview from './pages/QuizReview';
import Groups from './pages/Groups';
import Navbar from './components/Navbar';
import StudentOverview from './pages/StudentOverview';
import './styles/global/App.css';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return user ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!user || !user.is_staff) {
    return <Navigate to="/home" />;
  }
  
  return children;
};

const TeacherOrAdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!user || !(user.is_staff || (user.profile?.role === 'teacher'))) {
    return <Navigate to="/home" />;
  }
  
  return children;
};

const AppContent = () => {
  const location = useLocation();
  const showNavbar = !['/login', '/register', '/register-success'].includes(location.pathname);

  return (
    <div className="app">
      {showNavbar && <Navbar />}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/register-success" element={<RegisterSuccess />} />
        <Route
          path="/home"
          element={
            <PrivateRoute>
              <Home />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
        <Route
          path="/quiz"
          element={
            <PrivateRoute>
              <Quiz />
            </PrivateRoute>
          }
        />
        <Route
          path="/quiz-history"
          element={
            <PrivateRoute>
              <QuizHistory />
            </PrivateRoute>
          }
        />
        <Route
          path="/quiz-review/:attemptId"
          element={
            <PrivateRoute>
              <QuizReview />
            </PrivateRoute>
          }
        />
        <Route
          path="/groups"
          element={
            <PrivateRoute>
              <Groups />
            </PrivateRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <div>Settings Page (Coming Soon)</div>
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <div>Profile Page (Coming Soon)</div>
            </PrivateRoute>
          }
        />
        <Route
          path="/student/:username"
          element={
            <TeacherOrAdminRoute>
              <StudentOverview />
            </TeacherOrAdminRoute>
          }
        />
        <Route path="/" element={<Navigate to="/home" />} />
      </Routes>
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <AppContent />
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;
