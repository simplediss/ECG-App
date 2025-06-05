import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Container,
  Grid,
  Alert,
  Chip,
  Divider,
  Button,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import * as userApi from '../api/userApi';
import UserStatistics from '../components/statistics/UserStatistics';

const StudentOverview = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const [student, setStudent] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setLoading(true);
        const studentData = await userApi.getStudentDetails(username);
        setStudent(studentData);
        setError('');
      } catch (err) {
        console.error('Error fetching student data:', err);
        setError('Failed to fetch student data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchStudentData();
    }
  }, [username]);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Button
            startIcon={<ArrowBackIcon sx={{ color: darkMode ? '#ffffff' : undefined }} />}
            onClick={() => navigate('/groups')}
            sx={{
              color: darkMode ? '#ffffff' : undefined,
              mb: 2,
              '&:hover': {
                backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.08)' : undefined,
              }
            }}
          >
            Back to Groups
          </Button>
        </Box>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      </Container>
    );
  }

  if (!student) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Button
            startIcon={<ArrowBackIcon sx={{ color: darkMode ? '#ffffff' : undefined }} />}
            onClick={() => navigate('/groups')}
            sx={{
              color: darkMode ? '#ffffff' : undefined,
              mb: 2,
              '&:hover': {
                backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.08)' : undefined,
              }
            }}
          >
            Back to Groups
          </Button>
        </Box>
        <Alert severity="warning">Student not found.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon sx={{ color: darkMode ? '#ffffff' : undefined }} />}
          onClick={() => navigate('/groups')}
          sx={{
            color: darkMode ? '#ffffff' : undefined,
            mb: 2,
            '&:hover': {
              backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.08)' : undefined,
            }
          }}
        >
          Back to Groups
        </Button>
      </Box>

      {/* Student Profile Card */}
      <Card 
        sx={{ 
          width: '100%',
          backgroundColor: darkMode ? 'var(--bg-card)' : undefined,
          color: darkMode ? '#ffffff' : 'var(--text-primary)',
          border: darkMode ? '1px solid var(--border-color)' : undefined,
          boxShadow: darkMode ? 'var(--box-shadow)' : undefined,
          mb: 4
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <PersonIcon sx={{ mr: 1, color: darkMode ? '#ffffff' : undefined }} />
              <Typography variant="h5" component="div" sx={{ color: darkMode ? '#ffffff' : undefined }}>
                Profile
              </Typography>
            </Box>
            <Button
              variant={darkMode ? "outlined" : "contained"}
              startIcon={<TimelineIcon />}
              onClick={() => navigate(`/student/${username}/quizzes`)}
              sx={{
                backgroundColor: darkMode ? 'transparent' : 'primary.main',
                color: darkMode ? '#58a6ff' : '#fff',
                borderColor: darkMode ? '#58a6ff' : undefined,
                border: darkMode ? '1px solid' : 'none',
                fontWeight: 500,
                borderRadius: '4px',
                textTransform: 'none',
                '&:hover': {
                  backgroundColor: darkMode ? 'rgba(88, 166, 255, 0.1)' : undefined,
                }
              }}
            >
              View Quiz History
            </Button>
          </Box>
          <Divider sx={{ mb: 2, backgroundColor: darkMode ? 'rgba(255,255,255,0.12)' : undefined }} />
          <Grid 
            container 
            spacing={3} 
            sx={{ 
              display: 'flex',
              justifyContent: 'space-between'
            }}
          >
            <Grid  xs={12} md={6} lg={4}>
              <Box sx={{ 
                mb: { xs: 2, sm: 0 },
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                width: '100%'
              }}>
                <Typography variant="subtitle2" color={darkMode ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary'}>
                  Full Name
                </Typography>
                <Typography variant="body1" sx={{ color: darkMode ? '#ffffff' : undefined }}>
                  <strong>{student.first_name} {student.last_name}</strong>
                </Typography>
              </Box>
            </Grid>
            <Grid  xs={12} md={6} lg={4}>
              <Box sx={{ 
                mb: { xs: 2, sm: 0 },
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                width: '100%'
              }}>
                <Typography variant="subtitle2" color={darkMode ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary'}>
                  Gender
                </Typography>
                <Typography variant="body1" sx={{ color: darkMode ? '#ffffff' : undefined }}>
                  <strong>{student.gender || 'Not specified'}</strong>
                </Typography>
              </Box>
            </Grid>
            <Grid  xs={12} md={6} lg={4}>
              <Box sx={{ 
                mb: { xs: 2, sm: 0 },
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                width: '100%'
              }}>
                <Typography variant="subtitle2" color={darkMode ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary'}>
                  Date of Birth
                </Typography>
                <Typography variant="body1" sx={{ color: darkMode ? '#ffffff' : undefined }}>
                  <strong>{student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : 'Not specified'}</strong>
                </Typography>
              </Box>
            </Grid>
            <Grid  xs={12} md={6} lg={4}>
              <Box sx={{ 
                mb: { xs: 2, sm: 0 },
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                width: '100%'
              }}>
                <Typography variant="subtitle2" color={darkMode ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary'}>
                  Email
                </Typography>
                <Typography variant="body1" sx={{ color: darkMode ? '#ffffff' : undefined }}>
                  <strong>{student.email}</strong>
                </Typography>
              </Box>
            </Grid>
            <Grid  xs={12} md={6} lg={4}>
              <Box sx={{ 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                width: '100%'
              }}>
                <Typography variant="subtitle2" color={darkMode ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary'}>
                  Role
                </Typography>
                <Chip 
                  label={student.role.toUpperCase()} 
                  color="primary"
                  size="small"
                  sx={{ backgroundColor: darkMode ? '#58a6ff' : undefined, color: darkMode ? '#000000' : undefined }}
                />
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Box sx={{ mt: 4 }}>
        <UserStatistics 
          userId={student.user.id} 
          title={`${student.first_name} ${student.last_name}'s Statistics`} 
        />
      </Box>
    </Container>
  );
};

export default StudentOverview; 