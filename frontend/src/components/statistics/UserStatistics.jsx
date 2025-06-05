import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Grid,
    TextField,
    CircularProgress,
    Alert,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Fade,
} from '@mui/material';
import { getUserStatistics } from '../../api/statistics';
import { useTheme } from '../../context/ThemeContext';
import debounce from 'lodash/debounce';

const UserStatistics = ({ userId, title = 'User Statistics' }) => {
    const [statistics, setStatistics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [daysLimit, setDaysLimit] = useState('');
    const [quizLimit, setQuizLimit] = useState('');
    const { darkMode } = useTheme();

    const fetchStatistics = useCallback(async (days, quiz) => {
        try {
            setLoading(true);
            const data = await getUserStatistics(
                userId,
                days || null,
                quiz || null
            );
            setStatistics(data);
            setError(null);
        } catch (err) {
            setError('Failed to fetch statistics');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    // Create debounced version of fetchStatistics
    const debouncedFetchStatistics = useCallback(
        debounce((days, quiz) => {
            fetchStatistics(days, quiz);
        }, 500),
        [fetchStatistics]
    );

    // Initial fetch
    useEffect(() => {
        fetchStatistics(daysLimit, quizLimit);
    }, [fetchStatistics]);

    // Handle limit changes with debouncing
    const handleDaysLimitChange = (e) => {
        const value = e.target.value;
        if (value === '' || parseInt(value) >= 0) {
            setDaysLimit(value);
            debouncedFetchStatistics(value, quizLimit);
        }
    };

    const handleQuizLimitChange = (e) => {
        const value = e.target.value;
        if (value === '' || parseInt(value) >= 0) {
            setQuizLimit(value);
            debouncedFetchStatistics(daysLimit, value);
        }
    };

    if (error) {
        return (
            <Box p={3}>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    return (
        <Card sx={{ 
            backgroundColor: darkMode ? 'var(--bg-white)' : undefined,
            color: darkMode ? 'var(--text-primary)' : undefined,
            border: darkMode ? '1px solid var(--border-color)' : undefined,
            boxShadow: darkMode ? 'var(--box-shadow-sm)' : undefined,
            transition: 'all 0.3s ease',
        }}>
            <CardContent>
                <Typography variant="h5" gutterBottom sx={{ color: darkMode ? 'var(--text-primary)' : undefined }}>
                    {title}
                </Typography>

                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid  xs={12} sm={6}>
                        <TextField
                            label="Days Limit"
                            type="number"
                            value={daysLimit}
                            onChange={handleDaysLimitChange}
                            fullWidth
                            helperText="Filter statistics by number of days"
                            inputProps={{ min: 0 }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    color: darkMode ? 'var(--text-primary)' : undefined,
                                    backgroundColor: darkMode ? 'var(--bg-white)' : undefined,
                                    '& fieldset': {
                                        borderColor: darkMode ? 'var(--border-color)' : undefined,
                                    },
                                    '&:hover fieldset': {
                                        borderColor: darkMode ? 'var(--primary)' : undefined,
                                    },
                                },
                                '& .MuiInputLabel-root': {
                                    color: darkMode ? 'var(--text-secondary)' : undefined,
                                },
                                '& .MuiFormHelperText-root': {
                                    color: darkMode ? 'var(--text-secondary)' : undefined,
                                },
                            }}
                        />
                    </Grid>
                    <Grid  xs={12} sm={6}>
                        <TextField
                            label="Quiz Limit"
                            type="number"
                            value={quizLimit}
                            onChange={handleQuizLimitChange}
                            fullWidth
                            helperText="Filter statistics by number of quizzes"
                            inputProps={{ min: 0 }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    color: darkMode ? 'var(--text-primary)' : undefined,
                                    backgroundColor: darkMode ? 'var(--bg-white)' : undefined,
                                    '& fieldset': {
                                        borderColor: darkMode ? 'var(--border-color)' : undefined,
                                    },
                                    '&:hover fieldset': {
                                        borderColor: darkMode ? 'var(--primary)' : undefined,
                                    },
                                },
                                '& .MuiInputLabel-root': {
                                    color: darkMode ? 'var(--text-secondary)' : undefined,
                                },
                                '& .MuiFormHelperText-root': {
                                    color: darkMode ? 'var(--text-secondary)' : undefined,
                                },
                            }}
                        />
                    </Grid>
                </Grid>

                <Box sx={{ position: 'relative', minHeight: '200px' }}>
                    {loading && (
                        <Box
                            sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                backgroundColor: darkMode ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.7)',
                                borderRadius: '4px',
                                zIndex: 1,
                            }}
                        >
                            <CircularProgress />
                        </Box>
                    )}
                    
                    <Fade in={!loading} timeout={300}>
                        <Box>
                            {statistics && (
                                <>
                                    <Grid container spacing={3}>
                                        <Grid  xs={12} sm={6} md={3}>
                                            <Paper elevation={2} sx={{ 
                                                p: 2,
                                                backgroundColor: darkMode ? 'var(--bg-paper)' : undefined,
                                                color: darkMode ? 'var(--text-primary)' : undefined,
                                                border: darkMode ? '1px solid var(--border-color)' : undefined,
                                                transition: 'all 0.3s ease',
                                            }}>
                                                <Typography variant="subtitle2" sx={{ color: darkMode ? 'var(--text-secondary)' : 'text.secondary' }}>
                                                    Total Exams
                                                </Typography>
                                                <Typography variant="h4" sx={{ color: darkMode ? 'var(--primary)' : undefined }}>
                                                    {statistics.total_exams}
                                                </Typography>
                                            </Paper>
                                        </Grid>
                                        <Grid  xs={12} sm={6} md={3}>
                                            <Paper elevation={2} sx={{ 
                                                p: 2,
                                                backgroundColor: darkMode ? 'var(--bg-paper)' : undefined,
                                                color: darkMode ? 'var(--text-primary)' : undefined,
                                                border: darkMode ? '1px solid var(--border-color)' : undefined,
                                                transition: 'all 0.3s ease',
                                            }}>
                                                <Typography variant="subtitle2" sx={{ color: darkMode ? 'var(--text-secondary)' : 'text.secondary' }}>
                                                    Total Questions
                                                </Typography>
                                                <Typography variant="h4" sx={{ color: darkMode ? 'var(--primary)' : undefined }}>
                                                    {statistics.total_questions}
                                                </Typography>
                                            </Paper>
                                        </Grid>
                                        <Grid  xs={12} sm={6} md={3}>
                                            <Paper elevation={2} sx={{ 
                                                p: 2,
                                                backgroundColor: darkMode ? 'var(--bg-paper)' : undefined,
                                                color: darkMode ? 'var(--text-primary)' : undefined,
                                                border: darkMode ? '1px solid var(--border-color)' : undefined,
                                                transition: 'all 0.3s ease',
                                            }}>
                                                <Typography variant="subtitle2" sx={{ color: darkMode ? 'var(--text-secondary)' : 'text.secondary' }}>
                                                    Correct Answers
                                                </Typography>
                                                <Typography variant="h4" sx={{ color: darkMode ? 'var(--primary)' : undefined }}>
                                                    {statistics.correct_answers}
                                                </Typography>
                                            </Paper>
                                        </Grid>
                                        <Grid  xs={12} sm={6} md={3}>
                                            <Paper elevation={2} sx={{ 
                                                p: 2,
                                                backgroundColor: darkMode ? 'var(--bg-paper)' : undefined,
                                                color: darkMode ? 'var(--text-primary)' : undefined,
                                                border: darkMode ? '1px solid var(--border-color)' : undefined,
                                                transition: 'all 0.3s ease',
                                            }}>
                                                <Typography variant="subtitle2" sx={{ color: darkMode ? 'var(--text-secondary)' : 'text.secondary' }}>
                                                    Overall Accuracy
                                                </Typography>
                                                <Typography variant="h4" sx={{ color: darkMode ? 'var(--primary)' : undefined }}>
                                                    {statistics.overall_accuracy.toFixed(2)}%
                                                </Typography>
                                            </Paper>
                                        </Grid>
                                    </Grid>

                                    <Box sx={{ mt: 4 }}>
                                        <Typography variant="h6" gutterBottom sx={{ color: darkMode ? 'var(--text-primary)' : undefined }}>
                                            Performance by ECG Type
                                        </Typography>
                                        <TableContainer component={Paper} sx={{ 
                                            backgroundColor: darkMode ? 'var(--bg-paper)' : undefined,
                                            border: darkMode ? '1px solid var(--border-color)' : undefined,
                                            transition: 'all 0.3s ease',
                                        }}>
                                            <Table>
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell sx={{ 
                                                            color: darkMode ? 'var(--text-primary)' : undefined,
                                                            borderBottom: darkMode ? '1px solid var(--border-color)' : undefined,
                                                            fontWeight: 600,
                                                        }}>ECG Type</TableCell>
                                                        <TableCell align="right" sx={{ 
                                                            color: darkMode ? 'var(--text-primary)' : undefined,
                                                            borderBottom: darkMode ? '1px solid var(--border-color)' : undefined,
                                                            fontWeight: 600,
                                                        }}>Total Attempts</TableCell>
                                                        <TableCell align="right" sx={{ 
                                                            color: darkMode ? 'var(--text-primary)' : undefined,
                                                            borderBottom: darkMode ? '1px solid var(--border-color)' : undefined,
                                                            fontWeight: 600,
                                                        }}>Correct Attempts</TableCell>
                                                        <TableCell align="right" sx={{ 
                                                            color: darkMode ? 'var(--text-primary)' : undefined,
                                                            borderBottom: darkMode ? '1px solid var(--border-color)' : undefined,
                                                            fontWeight: 600,
                                                        }}>Accuracy</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {statistics.doc_class_statistics.map((stat) => (
                                                        <TableRow key={stat.label} sx={{
                                                            '&:hover': {
                                                                backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : undefined,
                                                            },
                                                            transition: 'all 0.3s ease',
                                                        }}>
                                                            <TableCell sx={{ 
                                                                color: darkMode ? 'var(--text-primary)' : undefined,
                                                                borderBottom: darkMode ? '1px solid var(--border-color)' : undefined,
                                                            }}>{stat.label}</TableCell>
                                                            <TableCell align="right" sx={{ 
                                                                color: darkMode ? 'var(--text-primary)' : undefined,
                                                                borderBottom: darkMode ? '1px solid var(--border-color)' : undefined,
                                                            }}>{stat.total_attempts}</TableCell>
                                                            <TableCell align="right" sx={{ 
                                                                color: darkMode ? 'var(--text-primary)' : undefined,
                                                                borderBottom: darkMode ? '1px solid var(--border-color)' : undefined,
                                                            }}>{stat.correct_attempts}</TableCell>
                                                            <TableCell align="right" sx={{ 
                                                                color: darkMode ? 'var(--text-primary)' : undefined,
                                                                borderBottom: darkMode ? '1px solid var(--border-color)' : undefined,
                                                            }}>{stat.total_attempts === 0 ? 'Unknown' : `${stat.accuracy.toFixed(2)}%`}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    </Box>
                                </>
                            )}
                        </Box>
                    </Fade>
                </Box>
            </CardContent>
        </Card>
    );
};

export default UserStatistics; 