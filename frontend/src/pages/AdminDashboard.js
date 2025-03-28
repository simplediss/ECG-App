import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import '../styles/AdminDashboard.css';
import './TeacherDashboard.css'; // Import teacher dashboard styles

const AdminDashboard = () => {
    const [students, setStudents] = useState([]);
    const [quizAttempts, setQuizAttempts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [studentStats, setStudentStats] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [filterBy, setFilterBy] = useState('all');
    const [timeRange, setTimeRange] = useState('all');
    const [activeSection, setActiveSection] = useState('admin');

    useEffect(() => {
        fetchStudents();
        fetchQuizAttempts();
    }, []);

    useEffect(() => {
        if (selectedStudent) {
            fetchStudentStats(selectedStudent.id);
        }
    }, [selectedStudent, timeRange]);

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

    const filteredStudents = students
        .filter(student => {
            // Check if student and student.user exist before accessing properties
            if (!student || !student.user) return false;
            
            return (
                student.user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                student.user.email.toLowerCase().includes(searchTerm.toLowerCase())
            );
        })
        .sort((a, b) => {
            if (!a.user || !b.user) return 0;
            
            switch (sortBy) {
                case 'name':
                    return a.user.username.localeCompare(b.user.username);
                case 'attempts':
                    return (quizAttempts.filter(attempt => attempt.user === b.user.id).length) -
                           (quizAttempts.filter(attempt => attempt.user === a.user.id).length);
                case 'score':
                    const aScore = getAverageScore(a.user.id);
                    const bScore = getAverageScore(b.user.id);
                    return bScore - aScore;
                default:
                    return 0;
            }
        });

    const getAverageScore = (userId) => {
        const userAttempts = quizAttempts.filter(attempt => attempt.user?.id === userId);
        if (userAttempts.length === 0) return 0;
        return userAttempts.reduce((acc, attempt) => acc + attempt.score, 0) / userAttempts.length;
    };

    const getStudentAttempts = (userId) => {
        return quizAttempts.filter(attempt => attempt.user?.id === userId);
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="admin-dashboard">
            <h1>Admin Dashboard</h1>
            
            <div className="dashboard-navigation">
                <button 
                    className={`nav-button ${activeSection === 'admin' ? 'active' : ''}`}
                    onClick={() => setActiveSection('admin')}
                >
                    Admin Functions
                </button>
                <button 
                    className={`nav-button ${activeSection === 'teacher' ? 'active' : ''}`}
                    onClick={() => setActiveSection('teacher')}
                >
                    Teacher Functions
                </button>
            </div>

            {activeSection === 'admin' && (
                <div className="admin-section">
                    <h2>Admin Controls</h2>
                    <p>The admin-specific controls are currently under development. Check back later for new features.</p>
                    <div className="admin-features">
                        <div className="feature-card">
                            <h3>User Management</h3>
                            <p>Create, edit, and delete user accounts</p>
                            <button className="feature-button">Manage Users</button>
                        </div>
                        <div className="feature-card">
                            <h3>Site Settings</h3>
                            <p>Configure application settings</p>
                            <button className="feature-button">Site Settings</button>
                        </div>
                        <div className="feature-card">
                            <h3>Content Management</h3>
                            <p>Manage quizzes and educational content</p>
                            <button className="feature-button">Manage Content</button>
                        </div>
                    </div>
                </div>
            )}

            {activeSection === 'teacher' && (
                <div className="teacher-dashboard-content">
                    {/* Filters and Search */}
                    <div className="dashboard-controls">
                        <div className="search-box">
                            <input
                                type="text"
                                placeholder="Search students..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="filter-controls">
                            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                                <option value="name">Sort by Name</option>
                                <option value="attempts">Sort by Attempts</option>
                                <option value="score">Sort by Average Score</option>
                            </select>
                            <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
                                <option value="all">All Time</option>
                                <option value="7">Last 7 Days</option>
                                <option value="30">Last 30 Days</option>
                                <option value="90">Last 90 Days</option>
                            </select>
                        </div>
                    </div>

                    <div className="dashboard-grid">
                        {/* Students Overview Section */}
                        <section className="dashboard-section students-section">
                            <h2>Students Overview</h2>
                            <div className="students-list">
                                {filteredStudents.map(student => (
                                    student && student.user ? (
                                        <div 
                                            key={student.id} 
                                            className={`student-card ${selectedStudent?.id === student.id ? 'selected' : ''}`}
                                            onClick={() => setSelectedStudent(selectedStudent?.id === student.id ? null : student)}
                                        >
                                            <h3>{student.user.first_name} {student.user.last_name}</h3>
                                            <p>Username: {student.user.username}</p>
                                            <p>Email: {student.user.email}</p>
                                            <p>Quiz Attempts: {getStudentAttempts(student.user.id).length}</p>
                                            <p>Average Score: {getAverageScore(student.user.id).toFixed(1)}%</p>
                                            <p>Last Active: {getLastActiveDate(getStudentAttempts(student.user.id))?.toLocaleDateString() || 'Never'}</p>
                                        </div>
                                    ) : null
                                ))}
                            </div>
                        </section>

                        {/* Selected Student Stats */}
                        {selectedStudent && studentStats && (
                            <section className="dashboard-section student-stats-section">
                                <h2>{selectedStudent.user.username}'s Performance</h2>
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
            )}
        </div>
    );
};

export default AdminDashboard; 