import React, { useState } from 'react';
import { Container, Typography, Box, Tabs, Tab } from '@mui/material';
import ValidationInterface from '../components/ECGValidation/ValidationInterface';
import ValidationHistory from '../components/ECGValidation/ValidationHistory';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

const ValidationPage = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState(0);
  const [activeTab, setActiveTab] = useState('make-validations');

  // Redirect if not a teacher
  if (!user?.profile?.role === 'teacher' && !user?.is_staff || !user?.profile?.role === 'admin') {
    return <Navigate to="/" replace />;
  }

  return (
    <Container maxWidth="lg">
      <Box py={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Validation
        </Typography>
        <Tabs 
          value={tab} 
          onChange={(_, v) => setTab(v)} 
          variant="fullWidth"
          textColor="inherit"          
          sx={{
            mb:2,
            '& .MuiTabs-indicator': {
              backgroundColor: 'var(--primary)'
            }
          }}
        >
          <Tab label="Validate"
            sx={{
              color: 'var(--text-primary)',
              '&.Mui-selected': {
                color: 'var(--primary)'
              }
            }}
          />
          <Tab label="View Past Validations"
            sx={{
              color: 'var(--text-primary)',
              '&.Mui-selected': {
                color: 'var(--primary)'
              }
            }}
          />
        </Tabs>
        {tab === 0 && <ValidationInterface />}
        {tab === 1 && <ValidationHistory />}
      </Box>
    </Container>
  );
};

export default ValidationPage; 