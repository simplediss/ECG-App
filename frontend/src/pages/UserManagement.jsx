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
    
    // Form state
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
            loadProfiles();
        } catch (error) {
            console.error('Error creating user:', error.response?.data || error.message);
            setError('Failed to create user. Please check the form and try again.');
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
            username: profile.user.username,
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
                {/* User Form Section */}
                <section className="user-form-section">
                    <h2>{editingUser ? 'Edit User' : 'Create New User'}</h2>
                    <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser}>
                        <div className="form-group">
                            <label htmlFor="username">Username</label>
                            <input
                                type="text"
                                id="username"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                required
                                disabled={editingUser}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="email">Email</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
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
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label htmlFor="password">{editingUser ? 'New Password (leave blank to keep current)' : 'Password'}</label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required={!editingUser}
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
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
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
                            {editingUser ? (
                                <>
                                    <button type="submit" className="btn btn-primary">Update User</button>
                                    <button type="button" className="btn btn-secondary" onClick={cancelEdit}>Cancel</button>
                                </>
                            ) : (
                                <button type="submit" className="btn btn-primary">Create User</button>
                            )}
                        </div>
                    </form>
                </section>
                
                {/* Users List Section */}
                <section className="users-list-section">
                    <h2>User List</h2>
                    <div className="filters">
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
                    
                    <div className="users-table-container">
                        <table className="users-table">
                            <thead>
                                <tr>
                                    <th>Username</th>
                                    <th>Email</th>
                                    <th>Name</th>
                                    <th>Role</th>
                                    <th>Gender</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="no-results">No users found</td>
                                    </tr>
                                ) : (
                                    filteredUsers.map(profile => (
                                        <tr key={profile.id}>
                                            <td>{profile.user.username}</td>
                                            <td>{profile.user.email}</td>
                                            <td>{`${profile.user.first_name || ''} ${profile.user.last_name || ''}`}</td>
                                            <td>{profile.role}</td>
                                            <td>{profile.gender || 'Not specified'}</td>
                                            <td className="action-buttons">
                                                <button 
                                                    className="btn btn-edit" 
                                                    onClick={() => editUser(profile)}
                                                >
                                                    Edit
                                                </button>
                                                <button 
                                                    className="btn btn-delete" 
                                                    onClick={() => handleDeleteUser(profile.id)}
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default UserManagement; 