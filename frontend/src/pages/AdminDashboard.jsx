import React, { useState, useEffect } from 'react';
import '../styles/pages/AdminDashboard.css';
import UserManagement from './UserManagement';
import { fetchProfiles } from '../api/userApi';
import { fetchQuizHistory } from '../api/quizApi';

const AdminDashboard = () => {
    const [students, setStudents] = useState([]);
    const [quizAttempts, setQuizAttempts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [filterBy, setFilterBy] = useState('all');

    useEffect(() => {
        fetchStudents();
        fetchQuizAttempts();
    }, []);

    const fetchStudents = async () => {
        try {
            const profiles = await fetchProfiles();
            // Filter out any profiles without user data
            const validStudents = profiles.filter(student => student && student.user);
            setStudents(validStudents);
        } catch (error) {
            console.error('Error fetching students:', error.response?.data || error.message);
            setStudents([]);
        }
    };

    const fetchQuizAttempts = async () => {
        try {
            const history = await fetchQuizHistory();
            setQuizAttempts(history);
        } catch (error) {
            console.error('Error fetching quiz attempts:', error.response?.data || error.message);
            setQuizAttempts([]);
        } finally {
            setLoading(false);
        }
    };

    const getAverageScore = (userId) => {
        const userAttempts = quizAttempts.filter(attempt => attempt.user?.id === userId);
        if (userAttempts.length === 0) return 0;
        return userAttempts.reduce((acc, attempt) => acc + attempt.score, 0) / userAttempts.length;
    };

    const getStudentAttempts = (userId) => {
        return quizAttempts.filter(attempt => attempt.user?.id === userId);
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
            if (!student || !student.user) return false;
            
            const searchMatch = student.user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             student.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             `${student.user.first_name} ${student.user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase());
            
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
                case 'attempts':
                    comparison = (quizAttempts.filter(attempt => attempt.user?.id === b.user.id).length) -
                               (quizAttempts.filter(attempt => attempt.user?.id === a.user.id).length);
                    break;
                case 'score':
                    const aScore = getAverageScore(a.user.id);
                    const bScore = getAverageScore(b.user.id);
                    comparison = bScore - aScore;
                    break;
                default:
                    return 0;
            }
            
            return comparison;
        });

    if (loading) {
        return <div className="loading-container">Loading...</div>;
    }

    return (
        <div className="admin-dashboard">
            <h1>Admin Dashboard</h1>
            
            <div className="admin-section">
                <h2>Admin Controls</h2>
                <p>The admin-specific controls are currently under development. Check back later for new features.</p>
            </div>

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
                    <select value={filterBy} onChange={(e) => setFilterBy(e.target.value)}>
                        <option value="all">All Students</option>
                        <option value="active">Active Students</option>
                        <option value="inactive">Inactive Students</option>
                        <option value="high">High Performers (≥70%)</option>
                        <option value="average">Average (50-69%)</option>
                        <option value="low">Low Performers (less than 50%)</option>
                    </select>
                </div>
            </div>

            <div className="dashboard-grid">
                <section className="dashboard-section students-section">
                    <h2>Students Overview</h2>
                    <div className="students-list">
                        {filteredStudents.map(student => (
                            student && student.user ? (
                                <div key={student.id} className="student-card">
                                    <h3>{student.user.first_name} {student.user.last_name}</h3>
                                    <p>Username: {student.user.username}</p>
                                    <p>Email: {student.user.email}</p>
                                    <p>Quiz Attempts: {getStudentAttempts(student.user.id).length}</p>
                                    <p>Average Score: {getAverageScore(student.user.id).toFixed(1)}</p>
                                    <p>Last Active: {getLastActiveDate(getStudentAttempts(student.user.id))?.toLocaleDateString() || 'Never'}</p>
                                </div>
                            ) : null
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default AdminDashboard; 