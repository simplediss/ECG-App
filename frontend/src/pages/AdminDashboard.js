import React from 'react';
import EcgSamplesList from '../components/EcgSamplesList';
import '../styles/AdminDashboard.css';

const AdminDashboard = () => {
    return (
        <div className="admin-dashboard">
            <h1>Admin Dashboard</h1>
            <div className="admin-section">
                <h2>ECG Samples Management</h2>
                <EcgSamplesList />
            </div>
        </div>
    );
};

export default AdminDashboard; 