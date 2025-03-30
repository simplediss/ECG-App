import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import './TeacherDashboard.css';

const TeacherDashboard = () => {
  const [students, setStudents] = useState([]);
  const [quizAttempts, setQuizAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentStats, setStudentStats] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [filterBy, setFilterBy] = useState('all');
  const [timeRange, setTimeRange] = useState('all');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [studentsPerPage, setStudentsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchStudents();
    fetchQuizAttempts();
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      fetchStudentStats(selectedStudent.id);
    }
  }, [selectedStudent, timeRange]);
  
  useEffect(() => {
    // Update total pages when students or studentsPerPage changes
    if (students.length > 0) {
      setTotalPages(Math.ceil(filteredStudents.length / studentsPerPage));
      // Reset to first page when filters change
      setCurrentPage(1);
    }
  }, [students, searchTerm, filterBy, studentsPerPage]);

  const fetchStudents = async () => {
    try {
      const response = await axiosInstance.get('profiles/');
      // Filter out any profiles without user data
      const validStudents = response.data.filter(student => student && student.user);
      setStudents(validStudents);
    } catch (error) {
      console.error('Error fetching students:', error.response?.data || error.message);
      setStudents([]);
    }
  };

  const fetchQuizAttempts = async () => {
    try {
      const response = await axiosInstance.get('quiz-attempts/');
      setQuizAttempts(response.data);
    } catch (error) {
      console.error('Error fetching quiz attempts:', error.response?.data || error.message);
      // Set empty array to prevent undefined errors
      setQuizAttempts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentStats = async (studentId) => {
    try {
      let studentAttempts = quizAttempts.filter(attempt => attempt.user?.id === selectedStudent.user.id);
      
      // Apply time range filter
      if (timeRange !== 'all') {
        const now = new Date();
        const daysAgo = parseInt(timeRange);
        studentAttempts = studentAttempts.filter(attempt => {
          const attemptDate = new Date(attempt.completed_at);
          return (now - attemptDate) <= (daysAgo * 24 * 60 * 60 * 1000);
        });
      }

      const stats = {
        totalAttempts: studentAttempts.length,
        averageScore: studentAttempts.reduce((acc, attempt) => acc + attempt.score, 0) / studentAttempts.length || 0,
        recentAttempts: studentAttempts.slice(-5),
        improvement: calculateImprovement(studentAttempts),
        consistency: calculateConsistency(studentAttempts),
        lastActive: getLastActiveDate(studentAttempts)
      };
      setStudentStats(stats);
    } catch (error) {
      console.error('Error fetching student stats:', error);
    }
  };

  const calculateImprovement = (attempts) => {
    if (attempts.length < 2) return 0;
    const sortedAttempts = [...attempts].sort((a, b) => new Date(a.completed_at) - new Date(b.completed_at));
    const firstScore = sortedAttempts[0].score;
    const lastScore = sortedAttempts[sortedAttempts.length - 1].score;
    return ((lastScore - firstScore) / firstScore) * 100;
  };

  const calculateConsistency = (attempts) => {
    if (attempts.length < 2) return 0;
    const scores = attempts.map(a => a.score);
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / scores.length;
    return Math.max(0, 100 - (variance / 2));
  };

  const getLastActiveDate = (attempts) => {
    if (attempts.length === 0) return null;
    const lastAttempt = attempts.reduce((latest, current) => 
      new Date(current.completed_at) > new Date(latest.completed_at) ? current : latest
    );
    return new Date(lastAttempt.completed_at);
  };

  const getAverageScore = (userId) => {
    const userAttempts = quizAttempts.filter(attempt => attempt.user?.id === userId);
    if (userAttempts.length === 0) return 0;
    return userAttempts.reduce((acc, attempt) => acc + attempt.score, 0) / userAttempts.length;
  };

  const getStudentAttempts = (userId) => {
    return quizAttempts.filter(attempt => attempt.user?.id === userId);
  };

  // Advanced filtering for students
  const filteredStudents = students
    .filter(student => {
      // Check if student and student.user exist before accessing properties
      if (!student || !student.user) return false;
      
      // Apply search filter
      const searchMatch = student.user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         `${student.user.first_name} ${student.user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Apply activity filter
      if (filterBy === 'active') {
        const hasAttempts = getStudentAttempts(student.user.id).length > 0;
        return searchMatch && hasAttempts;
      } else if (filterBy === 'inactive') {
        const hasAttempts = getStudentAttempts(student.user.id).length === 0;
        return searchMatch && hasAttempts;
      } else if (filterBy === 'high') {
        const avgScore = getAverageScore(student.user.id);
        return searchMatch && avgScore >= 70;
      } else if (filterBy === 'average') {
        const avgScore = getAverageScore(student.user.id);
        return searchMatch && avgScore >= 50 && avgScore < 70;
      } else if (filterBy === 'low') {
        const avgScore = getAverageScore(student.user.id);
        return searchMatch && avgScore < 50;
      }
      
      return searchMatch;
    })
    .sort((a, b) => {
      if (!a.user || !b.user) return 0;
      
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.user.username.localeCompare(b.user.username);
          break;
        case 'firstName':
          comparison = a.user.first_name.localeCompare(b.user.first_name);
          break;
        case 'lastName':
          comparison = a.user.last_name.localeCompare(b.user.last_name);
          break;
        case 'attempts':
          comparison = (quizAttempts.filter(attempt => attempt.user?.id === b.user.id).length) -
                       (quizAttempts.filter(attempt => attempt.user?.id === a.user.id).length);
          break;
        case 'score':
          const aScore = getAverageScore(a.user.id);
          const bScore = getAverageScore(b.user.id);
          comparison = bScore - aScore;
          break;
        case 'lastActive':
          const aDate = getLastActiveDate(getStudentAttempts(a.user.id));
          const bDate = getLastActiveDate(getStudentAttempts(b.user.id));
          if (!aDate && !bDate) return 0;
          if (!aDate) return 1;
          if (!bDate) return -1;
          comparison = bDate - aDate; // Most recent first
          break;
        default:
          return 0;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  // Get current page students
  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = filteredStudents.slice(indexOfFirstStudent, indexOfLastStudent);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  if (loading) {
    return <div className="loading-container">Loading...</div>;
  }

  return (
    <div className="teacher-dashboard">
      <h1>Teacher Dashboard</h1>
      
      {/* Dashboard Stats Summary */}
      <div className="dashboard-summary">
        <div className="summary-card">
          <h3>Total Students</h3>
          <p>{students.length}</p>
        </div>
        <div className="summary-card">
          <h3>Active Students</h3>
          <p>{students.filter(s => getStudentAttempts(s.user?.id).length > 0).length}</p>
        </div>
        <div className="summary-card">
          <h3>Total Attempts</h3>
          <p>{quizAttempts.length}</p>
        </div>
        <div className="summary-card">
          <h3>Avg. Score</h3>
          <p>{(quizAttempts.reduce((acc, a) => acc + a.score, 0) / quizAttempts.length || 0).toFixed(1)}%</p>
        </div>
      </div>
      
      {/* Enhanced Filters and Search */}
      <div className="dashboard-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by name, username, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="clear-search" onClick={() => setSearchTerm('')} aria-label="Clear search">
            {searchTerm && '×'}
          </button>
        </div>
        <div className="filter-controls">
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="name">Sort by Username</option>
            <option value="firstName">Sort by First Name</option>
            <option value="lastName">Sort by Last Name</option>
            <option value="attempts">Sort by Attempts</option>
            <option value="score">Sort by Average Score</option>
            <option value="lastActive">Sort by Last Activity</option>
          </select>
          <button 
            className="sort-direction" 
            onClick={toggleSortOrder} 
            aria-label={`Sort ${sortOrder === 'asc' ? 'ascending' : 'descending'}`}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
          <select value={filterBy} onChange={(e) => setFilterBy(e.target.value)}>
            <option value="all">All Students</option>
            <option value="active">Active Students</option>
            <option value="inactive">Inactive Students</option>
            <option value="high">High Performers (&ge;70%)</option>
            <option value="average">Average (50-69%)</option>
            <option value="low">Low Performers (&lt;50%)</option>
          </select>
          <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
            <option value="all">All Time</option>
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
          </select>
          <select 
            value={studentsPerPage} 
            onChange={(e) => setStudentsPerPage(Number(e.target.value))}
            className="per-page-select"
          >
            <option value="10">10 per page</option>
            <option value="20">20 per page</option>
            <option value="50">50 per page</option>
            <option value="100">100 per page</option>
          </select>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Students Overview Section */}
        <section className="dashboard-section students-section">
          <h2>Students Overview {filteredStudents.length > 0 && `(${indexOfFirstStudent + 1}-${Math.min(indexOfLastStudent, filteredStudents.length)} of ${filteredStudents.length})`}</h2>
          
          {filteredStudents.length === 0 ? (
            <div className="no-results">
              <p>No students match your search criteria. Try adjusting your filters.</p>
            </div>
          ) : (
            <>
              <div className="students-list">
                {currentStudents.map(student => (
                  student && student.user ? (
                    <div 
                      key={student.id} 
                      className={`student-card ${selectedStudent?.id === student.id ? 'selected' : ''}`}
                      onClick={() => setSelectedStudent(selectedStudent?.id === student.id ? null : student)}
                    >
                      <div className="student-header">
                        <h3>{student.user.first_name} {student.user.last_name}</h3>
                        {getLastActiveDate(getStudentAttempts(student.user.id)) ? (
                          <span className="active-indicator active" title="Active student">●</span>
                        ) : (
                          <span className="active-indicator inactive" title="Inactive student">●</span>
                        )}
                      </div>
                      <p className="username">@{student.user.username}</p>
                      <p className="email">{student.user.email}</p>
                      <div className="student-stats">
                        <div className="stat">
                          <span className="stat-label">Attempts:</span>
                          <span className="stat-value">{getStudentAttempts(student.user.id).length}</span>
                        </div>
                        <div className="stat">
                          <span className="stat-label">Avg. Score:</span>
                          <span className="stat-value">{getAverageScore(student.user.id).toFixed(1)}%</span>
                        </div>
                      </div>
                      <p className="last-active">
                        Last Active: {getLastActiveDate(getStudentAttempts(student.user.id))?.toLocaleDateString() || 'Never'}
                      </p>
                    </div>
                  ) : null
                ))}
              </div>
              
              {/* Pagination Controls */}
              <div className="pagination-controls">
                <button 
                  onClick={() => paginate(1)} 
                  disabled={currentPage === 1}
                  className="pagination-button"
                >
                  &laquo;
                </button>
                <button 
                  onClick={() => paginate(currentPage - 1)} 
                  disabled={currentPage === 1}
                  className="pagination-button"
                >
                  &lsaquo;
                </button>
                
                <div className="page-numbers">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    // Show pages around current page
                    const pageDiff = totalPages > 5 ? 2 : Math.floor(totalPages / 2);
                    let pageNum = currentPage - pageDiff + i;
                    
                    // Handle edge cases
                    if (pageNum <= 0) pageNum = i + 1;
                    if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                    
                    return pageNum > 0 && pageNum <= totalPages ? (
                      <button 
                        key={pageNum} 
                        onClick={() => paginate(pageNum)}
                        className={`pagination-button ${currentPage === pageNum ? 'active' : ''}`}
                      >
                        {pageNum}
                      </button>
                    ) : null;
                  })}
                </div>
                
                <button 
                  onClick={() => paginate(currentPage + 1)} 
                  disabled={currentPage === totalPages}
                  className="pagination-button"
                >
                  &rsaquo;
                </button>
                <button 
                  onClick={() => paginate(totalPages)} 
                  disabled={currentPage === totalPages}
                  className="pagination-button"
                >
                  &raquo;
                </button>
                
                <span className="page-info">
                  Page {currentPage} of {totalPages}
                </span>
              </div>
            </>
          )}
        </section>

        {/* Selected Student Stats */}
        {selectedStudent && studentStats && (
          <section className="dashboard-section student-stats-section">
            <h2>
              {selectedStudent.user.first_name} {selectedStudent.user.last_name}'s Performance
              <button 
                className="close-button" 
                onClick={() => setSelectedStudent(null)}
                aria-label="Close student details"
              >
                ×
              </button>
            </h2>
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Total Attempts</h3>
                <p className="stat-value">{studentStats.totalAttempts}</p>
              </div>
              <div className="stat-card">
                <h3>Average Score</h3>
                <p className="stat-value">{studentStats.averageScore.toFixed(1)}%</p>
              </div>
              <div className="stat-card">
                <h3>Improvement</h3>
                <p className={`stat-value ${studentStats.improvement >= 0 ? 'positive' : 'negative'}`}>
                  {studentStats.improvement.toFixed(1)}%
                </p>
              </div>
              <div className="stat-card">
                <h3>Consistency</h3>
                <p className="stat-value">{studentStats.consistency.toFixed(1)}%</p>
              </div>
            </div>
            
            {/* Recent attempts for this student */}
            <h3 className="section-subheading">Recent Quiz Attempts</h3>
            <div className="student-attempts-list">
              {studentStats.recentAttempts.length > 0 ? (
                studentStats.recentAttempts.map(attempt => (
                  <div key={attempt.id} className="student-attempt-item">
                    <div className="attempt-quiz-info">
                      <h4>{attempt.quiz?.title || 'Untitled Quiz'}</h4>
                      <p>{new Date(attempt.completed_at).toLocaleString()}</p>
                    </div>
                    <div className="attempt-score">
                      <span className={attempt.score >= 70 ? 'good' : attempt.score >= 50 ? 'average' : 'poor'}>
                        {attempt.score.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="no-attempts">No quiz attempts yet</p>
              )}
            </div>
          </section>
        )}

        {/* Recent Quiz Attempts Section */}
        <section className="dashboard-section attempts-section">
          <h2>Recent Quiz Attempts</h2>
          <div className="quiz-attempts-list">
            {quizAttempts
              .filter(attempt => {
                if (timeRange === 'all') return true;
                const attemptDate = new Date(attempt.completed_at);
                const daysAgo = parseInt(timeRange);
                const cutoffDate = new Date();
                cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
                return attemptDate >= cutoffDate;
              })
              .slice(0, 10)
              .map(attempt => (
                <div key={attempt.id} className="quiz-attempt-card">
                  <h3>Quiz: {attempt.quiz?.title || 'Untitled Quiz'}</h3>
                  <p>Student: {attempt.user?.username || 'Unknown Student'}</p>
                  <p className={`score ${attempt.score >= 70 ? 'good' : attempt.score >= 50 ? 'average' : 'poor'}`}>
                    Score: {attempt.score.toFixed(1)}%
                  </p>
                  <p>Date: {new Date(attempt.completed_at).toLocaleDateString()}</p>
                </div>
              ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default TeacherDashboard; 