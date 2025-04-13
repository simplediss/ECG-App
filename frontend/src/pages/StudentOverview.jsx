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
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Alert,
  LinearProgress,
  Chip,
  Divider,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  School as SchoolIcon,
  Assessment as AssessmentIcon,
  Timeline as TimelineIcon,
  Person as PersonIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import * as userApi from '../api/userApi';
import UserStatistics from '../components/statistics/UserStatistics';

const StudentOverview = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const [student, setStudent] = useState(null);
  const [quizAttempts, setQuizAttempts] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setLoading(true);
        const [studentData, attemptsData] = await Promise.all([
          userApi.getStudentDetails(username),
          userApi.getStudentQuizAttempts(username)
        ]);
        setStudent(studentData);
        setQuizAttempts(attemptsData);
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

  const calculatePerformanceMetrics = () => {
    if (!quizAttempts.length) return null;

    const totalAttempts = quizAttempts.length;
    const completedAttempts = quizAttempts.filter(attempt => attempt.completed_at).length;
    const averageScore = quizAttempts.reduce((sum, attempt) => sum + (attempt.score || 0), 0) / completedAttempts;
    const bestScore = Math.max(...quizAttempts.map(attempt => attempt.score || 0));
    
    return {
      totalAttempts,
      completedAttempts,
      averageScore,
      bestScore,
      completionRate: (completedAttempts / totalAttempts) * 100
    };
  };

  const metrics = calculatePerformanceMetrics();

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
            onClick={() => navigate(-1)}
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
            onClick={() => navigate(-1)}
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
          onClick={() => navigate(-1)}
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

      <Grid container spacing={3}>
        {/* Student Profile Card */}
        <Grid item xs={12} md={4}>
          <Card 
            sx={{ 
              height: '100%',
              backgroundColor: darkMode ? 'var(--bg-card)' : undefined,
              color: darkMode ? '#ffffff' : 'var(--text-primary)',
              border: darkMode ? '1px solid var(--border-color)' : undefined,
              boxShadow: darkMode ? 'var(--box-shadow)' : undefined,
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PersonIcon sx={{ mr: 1, color: darkMode ? '#ffffff' : undefined }} />
                <Typography variant="h5" component="div" sx={{ color: darkMode ? '#ffffff' : undefined }}>
                  Profile
                </Typography>
              </Box>
              <Divider sx={{ mb: 2, backgroundColor: darkMode ? 'rgba(255,255,255,0.12)' : undefined }} />
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color={darkMode ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary'}>
                  Full Name
                </Typography>
                <Typography variant="body1" sx={{ color: darkMode ? '#ffffff' : undefined }}>
                  <strong>{student.first_name} {student.last_name}</strong>
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color={darkMode ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary'}>
                  Gender
                </Typography>
                <Typography variant="body1" sx={{ color: darkMode ? '#ffffff' : undefined }}>
                  <strong>{student.gender || 'Not specified'}</strong>
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color={darkMode ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary'}>
                  Date of Birth
                </Typography>
                <Typography variant="body1" sx={{ color: darkMode ? '#ffffff' : undefined }}>
                  <strong>{student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : 'Not specified'}</strong>
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color={darkMode ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary'}>
                  Email
                </Typography>
                <Typography variant="body1" sx={{ color: darkMode ? '#ffffff' : undefined }}>
                  <strong>{student.email}</strong>
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
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
            </CardContent>
          </Card>
        </Grid>

        {/* Performance Metrics Card */}
        <Grid item xs={12} md={8}>
          <Card 
            sx={{ 
              height: '100%',
              backgroundColor: darkMode ? 'var(--bg-card)' : undefined,
              color: darkMode ? '#ffffff' : 'var(--text-primary)',
              border: darkMode ? '1px solid var(--border-color)' : undefined,
              boxShadow: darkMode ? 'var(--box-shadow)' : undefined,
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <AssessmentIcon sx={{ mr: 1, color: darkMode ? '#ffffff' : undefined }} />
                  <Typography variant="h5" component="div" sx={{ color: darkMode ? '#ffffff' : undefined }}>
                    Performance Metrics
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
              <Divider sx={{ mb: 3, backgroundColor: darkMode ? 'rgba(255,255,255,0.12)' : undefined }} />
              {metrics ? (
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Box 
                      sx={{ 
                        p: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary', textAlign: 'center' }}>
                        Average Score
                      </Typography>
                      <Typography variant="h4" sx={{ color: darkMode ? '#58a6ff' : 'primary.main', textAlign: 'center', mt: 1 }}>
                        {metrics.averageScore.toFixed(1)}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box 
                      sx={{ 
                        p: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary', textAlign: 'center' }}>
                        Best Score
                      </Typography>
                      <Typography variant="h4" sx={{ color: darkMode ? '#58a6ff' : 'primary.main', textAlign: 'center', mt: 1 }}>
                        {metrics.bestScore.toFixed(0)}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box 
                      sx={{ 
                        p: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary', textAlign: 'center' }}>
                        Completion Rate
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, width: '100%' }}>
                        <Box sx={{ width: '100%', mr: 1 }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={metrics.completionRate} 
                            sx={{ 
                              height: 8, 
                              borderRadius: 4,
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: darkMode ? '#58a6ff' : undefined
                              }
                            }}
                          />
                        </Box>
                        <Typography variant="body2" sx={{ color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary' }}>
                          {metrics.completionRate.toFixed(0)}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box 
                      sx={{ 
                        p: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary', textAlign: 'center' }}>
                        Total Attempts
                      </Typography>
                      <Typography variant="h4" sx={{ color: darkMode ? '#58a6ff' : 'primary.main', textAlign: 'center', mt: 1 }}>
                        {metrics.totalAttempts}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              ) : (
                <Alert severity="info">No quiz attempts found for this student.</Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

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