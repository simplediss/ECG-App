import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import { getUserStatistics } from '../../api/statistics';
import { useTheme } from '../../context/ThemeContext';

const UserStatistics = ({ userId, title = 'User Statistics' }) => {
    const [statistics, setStatistics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [daysLimit, setDaysLimit] = useState('');
    const [quizLimit, setQuizLimit] = useState('');
    const { darkMode } = useTheme();

    useEffect(() => {
        const fetchStatistics = async () => {
            try {
                setLoading(true);
                const data = await getUserStatistics(
                    userId,
                    daysLimit || null,
                    quizLimit || null
                );
                setStatistics(data);
                setError(null);
            } catch (err) {
                setError('Failed to fetch statistics');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchStatistics();
    }, [userId, daysLimit, quizLimit]);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box p={3}>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    if (!statistics) return null;

    return (
        <Card sx={{ 
            backgroundColor: darkMode ? 'var(--bg-white)' : undefined,
            color: darkMode ? 'var(--text-primary)' : undefined,
            border: darkMode ? '1px solid var(--border-color)' : undefined,
            boxShadow: darkMode ? 'var(--box-shadow-sm)' : undefined,
        }}>
            <CardContent>
                <Typography variant="h5" gutterBottom sx={{ color: darkMode ? 'var(--text-primary)' : undefined }}>
                    {title}
                </Typography>

                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Days Limit"
                            type="number"
                            value={daysLimit}
                            onChange={(e) => setDaysLimit(e.target.value)}
                            fullWidth
                            helperText="Filter statistics by number of days"
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
                    <Grid item xs={12} sm={6}>
                        <TextField
                            label="Quiz Limit"
                            type="number"
                            value={quizLimit}
                            onChange={(e) => setQuizLimit(e.target.value)}
                            fullWidth
                            helperText="Filter statistics by number of quizzes"
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

                <Grid container spacing={3}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Paper elevation={2} sx={{ 
                            p: 2,
                            backgroundColor: darkMode ? 'var(--bg-paper)' : undefined,
                            color: darkMode ? 'var(--text-primary)' : undefined,
                            border: darkMode ? '1px solid var(--border-color)' : undefined,
                        }}>
                            <Typography variant="subtitle2" sx={{ color: darkMode ? 'var(--text-secondary)' : 'text.secondary' }}>
                                Total Exams
                            </Typography>
                            <Typography variant="h4" sx={{ color: darkMode ? 'var(--primary)' : undefined }}>
                                {statistics.total_exams}
                            </Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Paper elevation={2} sx={{ 
                            p: 2,
                            backgroundColor: darkMode ? 'var(--bg-paper)' : undefined,
                            color: darkMode ? 'var(--text-primary)' : undefined,
                            border: darkMode ? '1px solid var(--border-color)' : undefined,
                        }}>
                            <Typography variant="subtitle2" sx={{ color: darkMode ? 'var(--text-secondary)' : 'text.secondary' }}>
                                Total Questions
                            </Typography>
                            <Typography variant="h4" sx={{ color: darkMode ? 'var(--primary)' : undefined }}>
                                {statistics.total_questions}
                            </Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Paper elevation={2} sx={{ 
                            p: 2,
                            backgroundColor: darkMode ? 'var(--bg-paper)' : undefined,
                            color: darkMode ? 'var(--text-primary)' : undefined,
                            border: darkMode ? '1px solid var(--border-color)' : undefined,
                        }}>
                            <Typography variant="subtitle2" sx={{ color: darkMode ? 'var(--text-secondary)' : 'text.secondary' }}>
                                Correct Answers
                            </Typography>
                            <Typography variant="h4" sx={{ color: darkMode ? 'var(--primary)' : undefined }}>
                                {statistics.correct_answers}
                            </Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Paper elevation={2} sx={{ 
                            p: 2,
                            backgroundColor: darkMode ? 'var(--bg-paper)' : undefined,
                            color: darkMode ? 'var(--text-primary)' : undefined,
                            border: darkMode ? '1px solid var(--border-color)' : undefined,
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
                                        }}>{stat.accuracy.toFixed(2)}%</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            </CardContent>
        </Card>
    );
};

export default UserStatistics; 