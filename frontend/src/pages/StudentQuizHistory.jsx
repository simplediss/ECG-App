import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Container,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Alert,
  LinearProgress,
  Chip,
  Divider,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Timeline as TimelineIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import * as userApi from '../api/userApi';

const StudentQuizHistory = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const [quizAttempts, setQuizAttempts] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuizAttempts = async () => {
      try {
        setLoading(true);
        const attemptsData = await userApi.getStudentQuizAttempts(username);
        setQuizAttempts(attemptsData);
        setError('');
      } catch (err) {
        console.error('Error fetching quiz attempts:', err);
        setError('Failed to fetch quiz attempts. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchQuizAttempts();
    }
  }, [username]);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <LinearProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Button
            startIcon={<ArrowBackIcon sx={{ color: darkMode ? '#ffffff' : undefined }} />}
            onClick={() => navigate(`/student/${username}`)}
            sx={{
              color: darkMode ? '#ffffff' : undefined,
              mb: 2,
              '&:hover': {
                backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.08)' : undefined,
              }
            }}
          >
            Back to Student Overview
          </Button>
        </Box>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon sx={{ color: darkMode ? '#ffffff' : undefined }} />}
          onClick={() => navigate(`/student/${username}`)}
          sx={{
            color: darkMode ? '#ffffff' : undefined,
            mb: 2,
            '&:hover': {
              backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.08)' : undefined,
            }
          }}
        >
          Back to Student Overview
        </Button>
      </Box>

      <Card 
        sx={{ 
          backgroundColor: darkMode ? 'var(--bg-card)' : undefined,
          color: darkMode ? '#ffffff' : 'var(--text-primary)',
          border: darkMode ? '1px solid var(--border-color)' : undefined,
          boxShadow: darkMode ? 'var(--box-shadow)' : undefined,
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <TimelineIcon sx={{ mr: 1, color: darkMode ? '#ffffff' : undefined }} />
            <Typography variant="h5" component="div" sx={{ color: darkMode ? '#ffffff' : undefined }}>
              Quiz History
            </Typography>
          </Box>
          <Divider sx={{ mb: 2, backgroundColor: darkMode ? 'rgba(255,255,255,0.12)' : undefined }} />
          
          {quizAttempts.length > 0 ? (
            <TableContainer 
              component={Paper} 
              elevation={0}
              sx={{ 
                backgroundColor: darkMode ? 'rgba(22, 27, 34, 0.7)' : undefined,
                color: darkMode ? '#ffffff' : 'var(--text-primary)',
                border: darkMode ? '1px solid var(--border-color)' : undefined,
                borderRadius: '8px',
                overflow: 'hidden'
              }}
            >
              <Table>
                <TableHead sx={{ backgroundColor: darkMode ? 'rgba(36, 41, 46, 0.9)' : 'rgba(0, 0, 0, 0.04)' }}>
                  <TableRow>
                    <TableCell 
                      sx={{ 
                        color: darkMode ? '#ffffff' : undefined, 
                        fontWeight: 600,
                        borderBottom: darkMode ? '1px solid rgba(255,255,255,0.12)' : undefined,
                        textAlign: 'center'
                      }}
                    >
                      Started At
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        color: darkMode ? '#ffffff' : undefined, 
                        fontWeight: 600,
                        borderBottom: darkMode ? '1px solid rgba(255,255,255,0.12)' : undefined,
                        textAlign: 'center'
                      }}
                    >
                      Completed At
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        color: darkMode ? '#ffffff' : undefined, 
                        fontWeight: 600,
                        borderBottom: darkMode ? '1px solid rgba(255,255,255,0.12)' : undefined,
                        textAlign: 'center'
                      }}
                    >
                      Questions
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        color: darkMode ? '#ffffff' : undefined, 
                        fontWeight: 600,
                        borderBottom: darkMode ? '1px solid rgba(255,255,255,0.12)' : undefined,
                        textAlign: 'center'
                      }}
                    >
                      Score
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        color: darkMode ? '#ffffff' : undefined, 
                        fontWeight: 600,
                        borderBottom: darkMode ? '1px solid rgba(255,255,255,0.12)' : undefined,
                        textAlign: 'center'
                      }}
                    >
                      Status
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        color: darkMode ? '#ffffff' : undefined, 
                        fontWeight: 600,
                        borderBottom: darkMode ? '1px solid rgba(255,255,255,0.12)' : undefined,
                        textAlign: 'center'
                      }}
                    >
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {quizAttempts.map((attempt, index) => (
                    <TableRow 
                      key={attempt.id} 
                      sx={{ 
                        '&:nth-of-type(odd)': { 
                          backgroundColor: darkMode ? 'rgba(36, 41, 46, 0.6)' : 'rgba(0, 0, 0, 0.02)' 
                        },
                        '&:hover': { 
                          backgroundColor: darkMode ? 'rgba(22, 27, 34, 0.9)' : 'rgba(0, 0, 0, 0.04)' 
                        },
                        borderBottom: darkMode 
                          ? index === quizAttempts.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.08)'
                          : undefined
                      }}
                    >
                      <TableCell sx={{ color: darkMode ? '#ffffff' : undefined, borderBottom: 'none', textAlign: 'center' }}>
                        {new Date(attempt.started_at).toLocaleDateString()}
                        <br />
                        {new Date(attempt.started_at).toLocaleTimeString(undefined, { hour12: false })}
                      </TableCell>
                      <TableCell sx={{ color: darkMode ? '#ffffff' : undefined, borderBottom: 'none', textAlign: 'center' }}>
                        {attempt.completed_at 
                          ? <>
                              {new Date(attempt.completed_at).toLocaleDateString()}
                              <br />
                              {new Date(attempt.completed_at).toLocaleTimeString(undefined, { hour12: false })}
                            </>
                          : 'In Progress'}
                      </TableCell>
                      <TableCell sx={{ color: darkMode ? '#ffffff' : undefined, borderBottom: 'none', textAlign: 'center' }}>
                        <Typography sx={{ fontWeight: 500 }}>
                          {attempt.correct_answers} <span style={{ color: darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' }}>/</span> {attempt.total_questions}
                        </Typography>
                        <Typography variant="caption" sx={{ color: darkMode ? 'rgba(255, 255, 255, 0.5)' : 'text.secondary' }}>
                          correct
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ color: darkMode ? '#ffffff' : undefined, borderBottom: 'none', textAlign: 'center' }}>
                        {attempt.score !== undefined ? (
                          <Typography 
                            sx={{ 
                              color: attempt.score >= 70 
                                ? (darkMode ? '#7ee787' : 'success.main') 
                                : attempt.score >= 50 
                                  ? (darkMode ? '#f0883e' : 'warning.main') 
                                  : (darkMode ? '#f85149' : 'error.main'),
                              fontWeight: 600
                            }}
                          >
                            {attempt.score.toFixed(1)}
                          </Typography>
                        ) : 'N/A'}
                      </TableCell>
                      <TableCell sx={{ borderBottom: 'none', textAlign: 'center' }}>
                        <Chip 
                          label={attempt.completed_at ? 'Completed' : 'In Progress'} 
                          color={attempt.completed_at ? 'success' : 'warning'}
                          size="small"
                          sx={{ 
                            fontWeight: 500,
                            backgroundColor: attempt.completed_at 
                              ? (darkMode ? 'rgba(126, 231, 135, 0.2)' : undefined) 
                              : (darkMode ? 'rgba(240, 136, 62, 0.2)' : undefined),
                            color: attempt.completed_at 
                              ? (darkMode ? '#7ee787' : undefined) 
                              : (darkMode ? '#f0883e' : undefined),
                            borderColor: attempt.completed_at 
                              ? (darkMode ? '#7ee787' : undefined) 
                              : (darkMode ? '#f0883e' : undefined),
                            border: darkMode ? '1px solid' : undefined,
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ borderBottom: 'none', textAlign: 'center' }}>
                        <Button
                          variant={darkMode ? "outlined" : "contained"}
                          size="small"
                          startIcon={<VisibilityIcon />}
                          onClick={() => navigate(`/quiz-review/${attempt.id}`)}
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
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1" sx={{ color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary' }}>
                No quiz attempts found for this student.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default StudentQuizHistory; 