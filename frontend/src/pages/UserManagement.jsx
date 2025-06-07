import React, { useState, useEffect } from 'react';
import * as userApi from '../api/userApi';
import '../styles/pages/UserManagement.css';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [editingUser, setEditingUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('username');
    const [filterRole, setFilterRole] = useState('all');
    
    // Form state for editing
    const [formData, setFormData] = useState({
        email: '',
        first_name: '',
        last_name: '',
        password: '',
        role: 'student',
        date_of_birth: '',
        gender: ''
    });

    useEffect(() => {
        loadProfiles();
    }, []);
    
    // Clear success message after 3 seconds
    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => {
                setSuccess(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [success]);

    const loadProfiles = async () => {
        try {
            setLoading(true);
            const data = await userApi.fetchProfiles();
            setProfiles(data);
            
            // Extract user data from profiles
            const userData = data.map(profile => profile.user);
            setUsers(userData);
        } catch (error) {
            console.error('Error fetching users:', error.response?.data || error.message);
            setError('Failed to load users. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateUser = async (e) => {
        e.preventDefault();
        if (!editingUser) return;
        
        try {
            setLoading(true);
            const updateData = { ...formData };
            
            // Remove password if it's empty (not being changed)
            if (!updateData.password) delete updateData.password;
            
            // Handle date_of_birth: if empty, set to null
            if (updateData.date_of_birth === '') {
                updateData.date_of_birth = null;
            }
            
            // Structure the data for the custom update endpoint
            const userData = {
                user: {
                    email: updateData.email,
                    first_name: updateData.first_name,
                    last_name: updateData.last_name
                },
                role: updateData.role,
                gender: updateData.gender,
                date_of_birth: updateData.date_of_birth
            };
            
            // Add password if provided
            if (updateData.password) {
                userData.user.password = updateData.password;
            }
            
            // Use the custom update endpoint
            const response = await userApi.updateUserProfile(editingUser.id, userData);
            
            setError(null);
            setSuccess(`User ${response.user.username} updated successfully!`);
            
            setEditingUser(null);
            resetForm();
            loadProfiles();
        } catch (error) {
            console.error('Error updating user:', error.response?.data || error.message);
            setError('Failed to update user. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            return;
        }
        
        try {
            setLoading(true);
            await userApi.deleteUserProfile(userId);
            setSuccess('User deleted successfully!');
            loadProfiles();
        } catch (error) {
            console.error('Error deleting user:', error.response?.data || error.message);
            setError('Failed to delete user. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            email: '',
            first_name: '',
            last_name: '',
            password: '',
            role: 'student',
            date_of_birth: '',
            gender: ''
        });
    };

    const editUser = (profile) => {
        setEditingUser(profile);
        
        // Format date_of_birth to YYYY-MM-DD for the date input if it exists
        let formattedDateOfBirth = '';
        if (profile.date_of_birth) {
            // Create a date object and format to YYYY-MM-DD
            const date = new Date(profile.date_of_birth);
            formattedDateOfBirth = date.toISOString().split('T')[0];
        }
        
        setFormData({
            email: profile.user.email,
            first_name: profile.user.first_name || '',
            last_name: profile.user.last_name || '',
            password: '', // Empty password field when editing
            role: profile.role === 'Student' ? 'student' : 'teacher',
            date_of_birth: formattedDateOfBirth,
            gender: profile.gender || ''
        });
    };

    const cancelEdit = () => {
        setEditingUser(null);
        resetForm();
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleEmailClick = (e) => {
        if (!window.confirm('Are you sure you want to change the email address? This will affect the user\'s login credentials.')) {
            e.preventDefault();
            e.target.blur();
        }
    };

    // Filter and sort users
    const filteredUsers = profiles
        .filter(profile => {
            // Apply search filter
            const userMatches = profile.user.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
                               (profile.user.email && profile.user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                               (profile.user.first_name && profile.user.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                               (profile.user.last_name && profile.user.last_name.toLowerCase().includes(searchTerm.toLowerCase()));
            
            // Apply role filter
            const roleMatches = filterRole === 'all' || 
                               (filterRole === 'student' && profile.role === 'Student') || 
                               (filterRole === 'teacher' && profile.role === 'Teacher');
            
            return userMatches && roleMatches;
        })
        .sort((a, b) => {
            // Apply sorting
            switch (sortBy) {
                case 'username':
                    return a.user.username.localeCompare(b.user.username);
                case 'email':
                    return a.user.email.localeCompare(b.user.email);
                case 'name':
                    const aName = `${a.user.first_name} ${a.user.last_name}`;
                    const bName = `${b.user.first_name} ${b.user.last_name}`;
                    return aName.localeCompare(bName);
                case 'role':
                    return a.role.localeCompare(b.role);
                default:
                    return 0;
            }
        });

    if (loading && profiles.length === 0) {
        return <div className="loading">Loading users...</div>;
    }

    return (
        <div className="user-management">
            <h1>User Management</h1>
            
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}
            
            <div className="user-management-container">
                {/* Search and Filter Controls */}
                <div className="user-controls">
                    <div className="search-box">
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="filter-controls">
                        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                            <option value="username">Sort by Username</option>
                            <option value="email">Sort by Email</option>
                            <option value="name">Sort by Name</option>
                            <option value="role">Sort by Role</option>
                        </select>
                        <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
                            <option value="all">All Roles</option>
                            <option value="student">Students Only</option>
                            <option value="teacher">Teachers Only</option>
                        </select>
                    </div>
                </div>

                {/* Edit User Form */}
                {editingUser && (
                    <section className="edit-user-section">
                        <h2>Edit User</h2>
                        <form onSubmit={handleUpdateUser}>
                            <div className="form-group">
                                <label htmlFor="email">Email</label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    onClick={handleEmailClick}
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
                                        onChange={handleChange}
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
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label htmlFor="password">New Password (leave blank to keep current)</label>
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="role">Role</label>
                                    <select
                                        id="role"
                                        name="role"
                                        value={formData.role}
                                        onChange={handleChange}
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
                                        onChange={handleChange}
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
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="form-actions">
                                <button type="submit" className="submit-button">Update User</button>
                                <button type="button" className="cancel-button" onClick={cancelEdit}>Cancel</button>
                            </div>
                        </form>
                    </section>
                )}

                {/* Users List */}
                <section className="users-list-section">
                    <h2>Users List</h2>
                    <div className="users-grid">
                        {filteredUsers.map(profile => (
                            <div key={profile.id} className="user-card">
                                <div className="user-header">
                                    <h3>{profile.user.username}</h3>
                                    <span className={`role-badge ${profile.role.toLowerCase()}`}>
                                        {profile.role}
                                    </span>
                                </div>
                                <div className="user-info">
                                    <p><strong>Name:</strong> {profile.user.first_name} {profile.user.last_name}</p>
                                    <p><strong>Email:</strong> {profile.user.email}</p>
                                    <p><strong>Gender:</strong> {profile.gender || 'Not specified'}</p>
                                    <p><strong>Date of Birth:</strong> {profile.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString() : 'Not specified'}</p>
                                </div>
                                <div className="user-actions">
                                    <button 
                                        className="edit-button"
                                        onClick={() => editUser(profile)}
                                    >
                                        Edit
                                    </button>
                                    <button 
                                        className="delete-button"
                                        onClick={() => handleDeleteUser(profile.id)}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default UserManagement; 