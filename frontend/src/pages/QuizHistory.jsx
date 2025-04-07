import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { fetchQuizHistory } from '../api/quizApi';
import { fetchMyGroups } from '../api/groupApi';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Alert,
  Chip,
  CircularProgress,
  Container,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

const QuizHistory = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const [quizHistory, setQuizHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [scoreFilter, setScoreFilter] = useState('all');
  const [groupFilter, setGroupFilter] = useState('all');
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    loadQuizHistory();
    if (isTeacherOrAdmin) {
      loadGroups();
    }
  }, []);

  const loadGroups = async () => {
    try {
      const data = await fetchMyGroups();
      setGroups(data);
    } catch (err) {
      console.error('Failed to load groups:', err);
    }
  };

  const loadQuizHistory = async () => {
    try {
      setIsLoading(true);
      const data = await fetchQuizHistory();
      // Sort quiz attempts by completed_at date in descending order (newest to oldest)
      const sortedData = [...data].sort((a, b) => {
        const dateA = a.completed_at ? new Date(a.completed_at) : new Date(0);
        const dateB = b.completed_at ? new Date(b.completed_at) : new Date(0);
        return dateB - dateA;
      });
      setQuizHistory(sortedData);
      setIsLoading(false);
    } catch (err) {
      setError('Failed to load quiz history. Please try again later.');
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).replace(/\//g, '/');
  };

  const formatScore = (score) => {
    if (typeof score !== 'number' || isNaN(score)) {
      return '0';
    }
    return `${Math.round(score)}`;
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const getScoreBackgroundColor = (score) => {
    if (darkMode) {
      if (score >= 80) return 'rgba(56, 176, 0, 0.2)';
      if (score >= 60) return 'rgba(255, 190, 11, 0.2)';
      return 'rgba(217, 4, 41, 0.2)';
    }
    return undefined;
  };

  const getScoreTextColor = (score) => {
    if (darkMode) {
      if (score >= 80) return '#38b000';
      if (score >= 60) return '#ffbe0b';
      return '#d90429';
    }
    return undefined;
  };

  const filterQuizHistory = () => {
    return quizHistory.filter(attempt => {
      // Search filter - only for teachers/admins
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !isTeacherOrAdmin || searchTerm === '' || 
        attempt.user?.username?.toLowerCase().includes(searchLower) ||
        attempt.user?.first_name?.toLowerCase().includes(searchLower) ||
        attempt.user?.last_name?.toLowerCase().includes(searchLower) ||
        `${attempt.user?.first_name || ''} ${attempt.user?.last_name || ''}`.toLowerCase().includes(searchLower);

      // Date filter
      const matchesDate = dateFilter === 'all' || 
        (dateFilter === 'today' && new Date(attempt.completed_at).toDateString() === new Date().toDateString()) ||
        (dateFilter === 'week' && new Date(attempt.completed_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) ||
        (dateFilter === 'month' && new Date(attempt.completed_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));

      // Score filter
      const matchesScore = scoreFilter === 'all' ||
        (scoreFilter === 'high' && attempt.score >= 80) ||
        (scoreFilter === 'medium' && attempt.score >= 60 && attempt.score < 80) ||
        (scoreFilter === 'low' && attempt.score < 60);

      // Group filter
      const matchesGroup = groupFilter === 'all' || 
        attempt.groups?.some(group => group.id === parseInt(groupFilter));

      return matchesSearch && matchesDate && matchesScore && matchesGroup;
    });
  };

  const isTeacherOrAdmin = user?.profile?.role === 'teacher' || user?.is_staff;

  if (isLoading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '50vh',
        backgroundColor: darkMode ? 'var(--bg-main)' : undefined
      }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, backgroundColor: darkMode ? 'var(--bg-main)' : undefined }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={loadQuizHistory}
          sx={{
            backgroundColor: darkMode ? 'var(--primary)' : undefined,
            '&:hover': {
              backgroundColor: darkMode ? 'var(--primary-dark)' : undefined,
            }
          }}
        >
          Retry
        </Button>
      </Box>
    );
  }

  const filteredHistory = filterQuizHistory();

  return (
    <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 }, mt: 4 }}>
      <Box sx={{ backgroundColor: darkMode ? 'var(--bg-main)' : undefined }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ color: darkMode ? 'var(--text-primary)' : undefined }}>
            Quiz History
          </Typography>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={loadQuizHistory}
            sx={{
              backgroundColor: darkMode ? 'var(--primary)' : undefined,
              '&:hover': {
                backgroundColor: darkMode ? 'var(--primary-dark)' : undefined,
              }
            }}
          >
            Refresh
          </Button>
        </Box>

        {quizHistory.length === 0 ? (
          <Box sx={{ 
            textAlign: 'center', 
            p: 4,
            backgroundColor: darkMode ? 'var(--bg-white)' : undefined,
            color: darkMode ? 'var(--text-primary)' : undefined,
            border: darkMode ? '1px solid var(--border-color)' : undefined,
            borderRadius: 1,
            boxShadow: darkMode ? 'var(--box-shadow-sm)' : undefined,
          }}>
            <Typography variant="h6" sx={{ mb: 2, color: darkMode ? 'var(--text-primary)' : undefined }}>
              You haven't taken any quizzes yet.
            </Typography>
            {!isTeacherOrAdmin && (
              <Button
                variant="contained"
                onClick={() => navigate('/quiz')}
                sx={{
                  backgroundColor: darkMode ? 'var(--primary)' : undefined,
                  '&:hover': {
                    backgroundColor: darkMode ? 'var(--primary-dark)' : undefined,
                  }
                }}
              >
                Take a Quiz
              </Button>
            )}
          </Box>
        ) : (
          <>
            <Box sx={{ 
              display: 'flex', 
              gap: 2, 
              mb: 3,
              flexWrap: 'wrap'
            }}>
              {isTeacherOrAdmin && (
                <>
                  <TextField
                    label="Search"
                    variant="outlined"
                    size="small"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{
                      minWidth: 200,
                      '& .MuiInputLabel-root': {
                        color: darkMode ? 'var(--text-secondary)' : undefined
                      },
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: darkMode ? 'var(--border-color)' : undefined
                        },
                        '&:hover fieldset': {
                          borderColor: darkMode ? 'var(--primary)' : undefined
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: darkMode ? 'var(--primary)' : undefined
                        },
                        color: darkMode ? 'var(--text-primary)' : undefined,
                        backgroundColor: darkMode ? 'var(--bg-white)' : undefined
                      }
                    }}
                  />
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel sx={{ color: darkMode ? 'var(--text-secondary)' : undefined }}>Group</InputLabel>
                    <Select
                      value={groupFilter}
                      label="Group"
                      onChange={(e) => setGroupFilter(e.target.value)}
                      sx={{
                        color: darkMode ? 'var(--text-primary)' : undefined,
                        backgroundColor: darkMode ? 'var(--bg-white)' : undefined,
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: darkMode ? 'var(--border-color)' : undefined
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: darkMode ? 'var(--primary)' : undefined
                        }
                      }}
                    >
                      <MenuItem value="all">All Groups</MenuItem>
                      {groups.map(group => (
                        <MenuItem key={group.id} value={group.id}>
                          {group.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </>
              )}
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel sx={{ color: darkMode ? 'var(--text-secondary)' : undefined }}>Date</InputLabel>
                <Select
                  value={dateFilter}
                  label="Date"
                  onChange={(e) => setDateFilter(e.target.value)}
                  sx={{
                    color: darkMode ? 'var(--text-primary)' : undefined,
                    backgroundColor: darkMode ? 'var(--bg-white)' : undefined,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: darkMode ? 'var(--border-color)' : undefined
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: darkMode ? 'var(--primary)' : undefined
                    }
                  }}
                >
                  <MenuItem value="all">All Time</MenuItem>
                  <MenuItem value="today">Today</MenuItem>
                  <MenuItem value="week">Last Week</MenuItem>
                  <MenuItem value="month">Last Month</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel sx={{ color: darkMode ? 'var(--text-secondary)' : undefined }}>Score</InputLabel>
                <Select
                  value={scoreFilter}
                  label="Score"
                  onChange={(e) => setScoreFilter(e.target.value)}
                  sx={{
                    color: darkMode ? 'var(--text-primary)' : undefined,
                    backgroundColor: darkMode ? 'var(--bg-white)' : undefined,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: darkMode ? 'var(--border-color)' : undefined
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: darkMode ? 'var(--primary)' : undefined
                    }
                  }}
                >
                  <MenuItem value="all">All Scores</MenuItem>
                  <MenuItem value="high">High (≥80%)</MenuItem>
                  <MenuItem value="medium">Medium (60-79%)</MenuItem>
                  <MenuItem value="low">Low (&lt;60%)</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <TableContainer 
              component={Paper} 
              sx={{ 
                backgroundColor: darkMode ? 'var(--bg-white)' : undefined,
                color: darkMode ? 'var(--text-primary)' : undefined,
                border: darkMode ? '1px solid var(--border-color)' : undefined,
                boxShadow: darkMode ? 'var(--box-shadow-sm)' : undefined,
              }}
            >
              <Table>
                <TableHead>
                  <TableRow>
                    {isTeacherOrAdmin && (
                      <TableCell sx={{ 
                        color: darkMode ? 'var(--text-primary)' : undefined, 
                        fontWeight: '600',
                        borderBottom: darkMode ? '1px solid var(--border-color)' : undefined,
                        textAlign: 'center'
                      }}>
                        Student
                      </TableCell>
                    )}
                    <TableCell sx={{ 
                      color: darkMode ? 'var(--text-primary)' : undefined, 
                      fontWeight: '600',
                      borderBottom: darkMode ? '1px solid var(--border-color)' : undefined,
                      textAlign: 'center'
                    }}>
                      Date
                    </TableCell>
                    <TableCell sx={{ 
                      color: darkMode ? 'var(--text-primary)' : undefined, 
                      fontWeight: '600',
                      borderBottom: darkMode ? '1px solid var(--border-color)' : undefined,
                      textAlign: 'center'
                    }}>
                      Score
                    </TableCell>
                    <TableCell sx={{ 
                      color: darkMode ? 'var(--text-primary)' : undefined, 
                      fontWeight: '600',
                      borderBottom: darkMode ? '1px solid var(--border-color)' : undefined,
                      textAlign: 'center'
                    }}>
                      Correct
                    </TableCell>
                    <TableCell sx={{ 
                      color: darkMode ? 'var(--text-primary)' : undefined, 
                      fontWeight: '600',
                      borderBottom: darkMode ? '1px solid var(--border-color)' : undefined,
                      textAlign: 'center'
                    }}>
                      Total
                    </TableCell>
                    <TableCell sx={{ 
                      color: darkMode ? 'var(--text-primary)' : undefined, 
                      fontWeight: '600',
                      borderBottom: darkMode ? '1px solid var(--border-color)' : undefined,
                      textAlign: 'center'
                    }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredHistory.map((attempt) => (
                    <TableRow 
                      key={attempt.id}
                      sx={{ 
                        '&:hover': { 
                          backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : undefined 
                        },
                        borderBottom: darkMode ? '1px solid var(--border-color)' : undefined
                      }}
                    >
                      {isTeacherOrAdmin && (
                        <TableCell sx={{ color: darkMode ? 'var(--text-primary)' : undefined, textAlign: 'center' }}>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {attempt.user?.username || 'Unknown Student'}
                            </Typography>
                            <Typography variant="body2" sx={{ color: darkMode ? 'var(--text-secondary)' : 'text.secondary' }}>
                              {attempt.user?.first_name} {attempt.user?.last_name}
                            </Typography>
                          </Box>
                        </TableCell>
                      )}
                      <TableCell sx={{ color: darkMode ? 'var(--text-primary)' : undefined, textAlign: 'center' }}>
                        {attempt.completed_at ? formatDate(attempt.completed_at) : 'In Progress'}
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Chip
                          label={formatScore(attempt.score)}
                          color={getScoreColor(attempt.score)}
                          size="small"
                          sx={{
                            backgroundColor: getScoreBackgroundColor(attempt.score),
                            color: getScoreTextColor(attempt.score),
                            fontWeight: 'bold',
                            textAlign: 'center'
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: darkMode ? 'var(--text-primary)' : undefined, textAlign: 'center' }}>
                        {attempt.correct_answers || 0}
                      </TableCell>
                      <TableCell sx={{ color: darkMode ? 'var(--text-primary)' : undefined, textAlign: 'center' }}>
                        {attempt.total_questions || 0}
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<VisibilityIcon />}
                          onClick={() => navigate(`/quiz-review/${attempt.id}`)}
                          sx={{
                            borderColor: darkMode ? 'var(--primary)' : undefined,
                            color: darkMode ? 'var(--primary)' : undefined,
                            '&:hover': {
                              backgroundColor: darkMode ? 'rgba(67, 97, 238, 0.1)' : undefined,
                              borderColor: darkMode ? 'var(--primary)' : undefined,
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
          </>
        )}
      </Box>
    </Container>
  );
};

export default QuizHistory; 