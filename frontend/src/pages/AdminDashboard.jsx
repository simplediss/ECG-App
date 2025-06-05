import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Card,
  CardContent,
} from '@mui/material';
import UserManagement from './UserManagement';
import { fetchProfiles } from '../api/userApi';
import { fetchQuizHistory } from '../api/quizApi';
import * as userApi from '../api/userApi';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState(0);
    const [students, setStudents] = useState([]);
    const [quizAttempts, setQuizAttempts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [filterBy, setFilterBy] = useState('all');
    const [success, setSuccess] = useState(null);
    const [error, setError] = useState(null);

    // Form state for new user
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        password: '',
        role: 'student',
        date_of_birth: '',
        gender: ''
    });

    useEffect(() => {
        if (activeTab === 0) {
            fetchStudents();
            fetchQuizAttempts();
        }
    }, [activeTab]);

    // Clear success message after 3 seconds
    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => {
                setSuccess(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [success]);

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

    const getTotalStudents = () => filteredStudents.length;
    const getActiveStudents = () => filteredStudents.filter(student => getStudentAttempts(student.user.id).length > 0).length;
    const getAverageClassScore = () => {
        const scores = filteredStudents.map(student => getAverageScore(student.user.id));
        return scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : 0;
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const userData = { ...formData };
            
            // Handle date_of_birth: if empty, set to null
            if (userData.date_of_birth === '') {
                userData.date_of_birth = null;
            }
            
            await userApi.createUser(userData);
            setSuccess('User created successfully!');
            resetForm();
        } catch (error) {
            console.error('Error creating user:', error.response?.data || error.message);
            setError('Failed to create user. Please check the form and try again.');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            username: '',
            email: '',
            first_name: '',
            last_name: '',
            password: '',
            role: 'student',
            date_of_birth: '',
            gender: ''
        });
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    if (loading && activeTab === 0) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="lg">
            <Box py={4}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Admin Dashboard
                </Typography>

                <Tabs 
                    value={activeTab} 
                    onChange={(_, v) => setActiveTab(v)} 
                    sx={{ mb: 3 }}
                    fullWidth
                    variant="fullWidth"
                >
                    <Tab label="Overview" />
                    <Tab label="Create User" />
                    <Tab label="User Management" />
                </Tabs>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}
                {success && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                        {success}
                    </Alert>
                )}

                {activeTab === 0 && (
                    <>
                        <Grid container spacing={3} sx={{ mb: 4 }}>
                            <Grid  xs={12} md={4}>
                                <Card>
                                    <CardContent>
                                        <Typography color="textSecondary" gutterBottom>
                                            Total Students
                                        </Typography>
                                        <Typography variant="h4">
                                            {getTotalStudents()}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid  xs={12} md={4}>
                                <Card>
                                    <CardContent>
                                        <Typography color="textSecondary" gutterBottom>
                                            Active Students
                                        </Typography>
                                        <Typography variant="h4">
                                            {getActiveStudents()}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid  xs={12} md={4}>
                                <Card>
                                    <CardContent>
                                        <Typography color="textSecondary" gutterBottom>
                                            Average Class Score
                                        </Typography>
                                        <Typography variant="h4">
                                            {getAverageClassScore()}%
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>

                        <Paper sx={{ p: 2, mb: 3 }}>
                            <Grid container spacing={2} alignItems="center">
                                <Grid  xs={12} md={4}>
                                    <TextField
                                        fullWidth
                                        label="Search students"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </Grid>
                                <Grid  xs={12} md={4}>
                                    <FormControl fullWidth>
                                        <InputLabel>Sort By</InputLabel>
                                        <Select
                                            value={sortBy}
                                            label="Sort By"
                                            onChange={(e) => setSortBy(e.target.value)}
                                        >
                                            <MenuItem value="name">Name</MenuItem>
                                            <MenuItem value="attempts">Attempts</MenuItem>
                                            <MenuItem value="score">Score</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid  xs={12} md={4}>
                                    <FormControl fullWidth>
                                        <InputLabel>Filter By</InputLabel>
                                        <Select
                                            value={filterBy}
                                            label="Filter By"
                                            onChange={(e) => setFilterBy(e.target.value)}
                                        >
                                            <MenuItem value="all">All</MenuItem>
                                            <MenuItem value="active">Active</MenuItem>
                                            <MenuItem value="inactive">Inactive</MenuItem>
                                            <MenuItem value="high">High Performers</MenuItem>
                                            <MenuItem value="average">Average</MenuItem>
                                            <MenuItem value="low">Low Performers</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                            </Grid>
                        </Paper>
                    </>
                )}

                {activeTab === 1 && (
                    <Paper sx={{ p: 3 }}>
                        <h2>Create New User</h2>
                        <form onSubmit={handleCreateUser} className="create-user-form">
                            <div className="form-group">
                        
                            </div>
                            <div className="form-group">
                                <label htmlFor="email">Email</label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleFormChange}
                                    required
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="first_name">First Name</label>
                                    <input
                                        type="text"
                                        id="first_name"
                                        name="first_name"
                                        value={formData.first_name}
                                        onChange={handleFormChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="last_name">Last Name</label>
                                    <input
                                        type="text"
                                        id="last_name"
                                        name="last_name"
                                        value={formData.last_name}
                                        onChange={handleFormChange}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label htmlFor="password">Password</label>
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleFormChange}
                                    required
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="role">Role</label>
                                    <select
                                        id="role"
                                        name="role"
                                        value={formData.role}
                                        onChange={handleFormChange}
                                        required
                                    >
                                        <option value="student">Student</option>
                                        <option value="teacher">Teacher</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="gender">Gender</label>
                                    <select
                                        id="gender"
                                        name="gender"
                                        value={formData.gender}
                                        onChange={handleFormChange}
                                    >
                                        <option value="">Select Gender</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label htmlFor="date_of_birth">Date of Birth</label>
                                <input
                                    type="date"
                                    id="date_of_birth"
                                    name="date_of_birth"
                                    value={formData.date_of_birth}
                                    onChange={handleFormChange}
                                />
                            </div>
                            <div className="form-actions">
                                <button type="submit" className="submit-button">Create User</button>
                                <button type="button" className="reset-button" onClick={resetForm}>Reset Form</button>
                            </div>
                        </form>
                    </Paper>
                )}

                {activeTab === 2 && (
                    <UserManagement />
                )}
            </Box>
        </Container>
    );
};

export default AdminDashboard; 