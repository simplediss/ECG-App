import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  Tooltip,
  Badge,
  Avatar,
  Paper,
  Stack,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  Star as StarIcon,
  Timeline as TimelineIcon,
  Speed as SpeedIcon,
  Psychology as BrainIcon,
  School as SchoolIcon,
  MilitaryTech as MedalIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { getUserStatistics } from '../api/statistics';
import { getStudentQuizAttempts } from '../api/userApi';
import EcgStarsRoad from './EcgStarsRoad';

const Achievements = () => {
  const { user } = useAuth();
  const [statistics, setStatistics] = useState(null);
  const [quizAttempts, setQuizAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [stats, attempts] = await Promise.all([
          getUserStatistics(user.id),
          getStudentQuizAttempts(user.username)
        ]);
        setStatistics(stats);
        setQuizAttempts(attempts);
      } catch (err) {
        setError('Failed to load achievements data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  // Calculate achievements based on statistics and quiz attempts
  const calculateAchievements = () => {
    if (!statistics || !quizAttempts) return [];

    // Calculate additional statistics
    const totalQuestions = statistics.total_questions || 0;
    const totalCorrect = statistics.correct_answers || 0;
    const averageScore = quizAttempts.length > 0 
      ? quizAttempts.reduce((acc, attempt) => acc + attempt.score, 0) / quizAttempts.length 
      : 0;
    const perfectQuizzes = quizAttempts.filter(attempt => attempt.score === 100).length;
    const highAccuracyQuizzes = quizAttempts.filter(attempt => attempt.score >= 90).length;
    const fastQuizzes = quizAttempts.filter(attempt => attempt.duration < 300).length;
    const consecutiveDays = calculateConsecutiveDays(quizAttempts);
    const totalTimeSpent = quizAttempts.reduce((acc, attempt) => acc + (attempt.duration || 0), 0);
    const averageTimePerQuiz = quizAttempts.length > 0 ? totalTimeSpent / quizAttempts.length : 0;

    const achievements = [
      // Quiz Completion Achievements
      {
        id: 'quiz_master',
        title: 'Quiz Master',
        description: 'Complete 10 quizzes',
        icon: <TrophyIcon />,
        progress: Math.min((quizAttempts.length / 10) * 100, 100),
        completed: quizAttempts.length >= 10,
        color: '#FFD700',
        rarity: 'gold',
        category: 'completion'
      },
      {
        id: 'quiz_enthusiast',
        title: 'Quiz Enthusiast',
        description: 'Complete 25 quizzes',
        icon: <TrophyIcon />,
        progress: Math.min((quizAttempts.length / 25) * 100, 100),
        completed: quizAttempts.length >= 25,
        color: '#FFD700',
        rarity: 'gold',
        category: 'completion'
      },
      {
        id: 'quiz_legend',
        title: 'Quiz Legend',
        description: 'Complete 50 quizzes',
        icon: <TrophyIcon />,
        progress: Math.min((quizAttempts.length / 50) * 100, 100),
        completed: quizAttempts.length >= 50,
        color: '#FFD700',
        rarity: 'gold',
        category: 'completion'
      },

      // Accuracy Achievements
      {
        id: 'accuracy_king',
        title: 'Accuracy King',
        description: 'Achieve 90% accuracy in any quiz',
        icon: <StarIcon />,
        progress: Math.min((statistics.overall_accuracy / 90) * 100, 100),
        completed: statistics.overall_accuracy >= 90,
        color: '#FF69B4',
        rarity: 'silver',
        category: 'accuracy'
      },
      {
        id: 'accuracy_master',
        title: 'Accuracy Master',
        description: 'Achieve 90% accuracy in 5 quizzes',
        icon: <StarIcon />,
        progress: Math.min((highAccuracyQuizzes / 5) * 100, 100),
        completed: highAccuracyQuizzes >= 5,
        color: '#FF69B4',
        rarity: 'gold',
        category: 'accuracy'
      },
      {
        id: 'perfect_score',
        title: 'Perfect Score',
        description: 'Get 100% on any quiz',
        icon: <SchoolIcon />,
        progress: quizAttempts.some(attempt => attempt.score === 100) ? 100 : 0,
        completed: quizAttempts.some(attempt => attempt.score === 100),
        color: '#FF4500',
        rarity: 'gold',
        category: 'accuracy'
      },
      {
        id: 'perfect_master',
        title: 'Perfect Master',
        description: 'Get 100% on 3 quizzes',
        icon: <SchoolIcon />,
        progress: Math.min((perfectQuizzes / 3) * 100, 100),
        completed: perfectQuizzes >= 3,
        color: '#FF4500',
        rarity: 'gold',
        category: 'accuracy'
      },

      // Speed Achievements
      {
        id: 'speed_demon',
        title: 'Speed Demon',
        description: 'Complete a quiz in under 5 minutes',
        icon: <SpeedIcon />,
        progress: quizAttempts.some(attempt => attempt.duration < 300) ? 100 : 0,
        completed: quizAttempts.some(attempt => attempt.duration < 300),
        color: '#00CED1',
        rarity: 'bronze',
        category: 'speed'
      },
      {
        id: 'speed_master',
        title: 'Speed Master',
        description: 'Complete 5 quizzes in under 5 minutes',
        icon: <SpeedIcon />,
        progress: Math.min((fastQuizzes / 5) * 100, 100),
        completed: fastQuizzes >= 5,
        color: '#00CED1',
        rarity: 'silver',
        category: 'speed'
      },
      {
        id: 'lightning_fast',
        title: 'Lightning Fast',
        description: 'Complete a quiz in under 3 minutes',
        icon: <SpeedIcon />,
        progress: quizAttempts.some(attempt => attempt.duration < 180) ? 100 : 0,
        completed: quizAttempts.some(attempt => attempt.duration < 180),
        color: '#00CED1',
        rarity: 'gold',
        category: 'speed'
      },

      // Consistency Achievements
      {
        id: 'consistent_learner',
        title: 'Consistent Learner',
        description: 'Take quizzes for 5 consecutive days',
        icon: <TimelineIcon />,
        progress: Math.min((consecutiveDays / 5) * 100, 100),
        completed: consecutiveDays >= 5,
        color: '#9370DB',
        rarity: 'silver',
        category: 'consistency'
      },
      {
        id: 'dedicated_learner',
        title: 'Dedicated Learner',
        description: 'Take quizzes for 10 consecutive days',
        icon: <TimelineIcon />,
        progress: Math.min((consecutiveDays / 10) * 100, 100),
        completed: consecutiveDays >= 10,
        color: '#9370DB',
        rarity: 'gold',
        category: 'consistency'
      },
      {
        id: 'daily_grinder',
        title: 'Daily Grinder',
        description: 'Complete at least one quiz every day for a month',
        icon: <TimelineIcon />,
        progress: Math.min((consecutiveDays / 30) * 100, 100),
        completed: consecutiveDays >= 30,
        color: '#9370DB',
        rarity: 'gold',
        category: 'consistency'
      },

      // ECG Expertise Achievements
      {
        id: 'ecg_expert',
        title: 'ECG Expert',
        description: 'Master all ECG types',
        icon: <BrainIcon />,
        progress: Math.min((statistics.doc_class_statistics.filter(stat => stat.accuracy >= 80).length / statistics.doc_class_statistics.length) * 100, 100),
        completed: statistics.doc_class_statistics.every(stat => stat.accuracy >= 80),
        color: '#32CD32',
        rarity: 'gold',
        category: 'expertise'
      },
      {
        id: 'ecg_master',
        title: 'ECG Master',
        description: 'Achieve 90% accuracy in any ECG type',
        icon: <BrainIcon />,
        progress: Math.min((statistics.doc_class_statistics.filter(stat => stat.accuracy >= 90).length / statistics.doc_class_statistics.length) * 100, 100),
        completed: statistics.doc_class_statistics.some(stat => stat.accuracy >= 90),
        color: '#32CD32',
        rarity: 'gold',
        category: 'expertise'
      },
      {
        id: 'ecg_grandmaster',
        title: 'ECG Grandmaster',
        description: 'Achieve 95% accuracy in any ECG type',
        icon: <BrainIcon />,
        progress: Math.min((statistics.doc_class_statistics.filter(stat => stat.accuracy >= 95).length / statistics.doc_class_statistics.length) * 100, 100),
        completed: statistics.doc_class_statistics.some(stat => stat.accuracy >= 95),
        color: '#32CD32',
        rarity: 'gold',
        category: 'expertise'
      },

      // Time Investment Achievements
      {
        id: 'time_investor',
        title: 'Time Investor',
        description: 'Spend 1 hour on quizzes',
        icon: <TimelineIcon />,
        progress: Math.min((totalTimeSpent / 3600) * 100, 100),
        completed: totalTimeSpent >= 3600,
        color: '#9370DB',
        rarity: 'bronze',
        category: 'time'
      },
      {
        id: 'time_master',
        title: 'Time Master',
        description: 'Spend 5 hours on quizzes',
        icon: <TimelineIcon />,
        progress: Math.min((totalTimeSpent / 18000) * 100, 100),
        completed: totalTimeSpent >= 18000,
        color: '#9370DB',
        rarity: 'silver',
        category: 'time'
      },
      {
        id: 'time_legend',
        title: 'Time Legend',
        description: 'Spend 10 hours on quizzes',
        icon: <TimelineIcon />,
        progress: Math.min((totalTimeSpent / 36000) * 100, 100),
        completed: totalTimeSpent >= 36000,
        color: '#9370DB',
        rarity: 'gold',
        category: 'time'
      }
    ];

    return achievements;
  };

  // Helper function to calculate consecutive days
  const calculateConsecutiveDays = (attempts) => {
    if (!attempts.length) return 0;
    
    const dates = attempts
      .map(attempt => new Date(attempt.completed_at).toDateString())
      .sort((a, b) => new Date(a) - new Date(b));
    
    let maxStreak = 1;
    let currentStreak = 1;
    
    for (let i = 1; i < dates.length; i++) {
      const prevDate = new Date(dates[i - 1]);
      const currDate = new Date(dates[i]);
      const diffDays = Math.floor((currDate - prevDate) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else if (diffDays > 1) {
        currentStreak = 1;
      }
    }
    
    return maxStreak;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <LinearProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  const achievements = calculateAchievements();
  const completedAchievements = achievements.filter(a => a.completed).length;

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'gold':
        return '#FFD700';
      case 'silver':
        return '#C0C0C0';
      case 'bronze':
        return '#CD7F32';
      default:
        return 'var(--text-secondary)';
    }
  };

  return (
    <Card sx={{ 
      backgroundColor: 'var(--bg-white)',
      color: 'var(--text-primary)',
      border: '1px solid var(--border-color)',
      boxShadow: 'var(--box-shadow-sm)',
      backgroundColor: 'var(--bg-white)',
    }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={3}>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ flexGrow: 1 }}>
            <MedalIcon sx={{ fontSize: 32, color: 'var(--primary)' }} />
            <Typography variant="h5" gutterBottom sx={{ color: 'var(--text-primary)' }}>
              Achievement Hall
            </Typography>
          </Stack>
          <Badge
            badgeContent={completedAchievements}
            color="primary"
            sx={{ '& .MuiBadge-badge': { fontSize: '1rem', height: '24px', minWidth: '24px' } }}
          >
            <TrophyIcon sx={{ fontSize: 32, color: 'var(--primary)' }} />
          </Badge>
        </Box>

        {/* ECG Stars Road - 500 stars, scrollable version */}
        {statistics && (
          <EcgStarsRoad correctAnswers={statistics.correct_answers} scrollable={true} />
        )}

        <Grid container spacing={3} justifyContent="center">
          {achievements.map((achievement) => (
            <Grid item key={achievement.id}>
              <Tooltip title={achievement.description} arrow placement="top">
                <Paper
                  elevation={achievement.completed ? 3 : 1}
                  sx={{
                    p: 2,
                    height: '140px',
                    width: '250px',
                    backgroundColor: achievement.completed ? 'var(--bg-paper)' : 'var(--bg-white)',
                    border: '2px solid',
                    borderColor: achievement.completed ? getRarityColor(achievement.rarity) : 'var(--border-color)',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    overflow: 'hidden',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: 'var(--box-shadow-md)',
                    },
                    '&::before': achievement.completed ? {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: `linear-gradient(45deg, ${getRarityColor(achievement.rarity)}22, transparent)`,
                      zIndex: 0,
                    } : {},
                  }}
                >
                  <Box display="flex" flexDirection="column" height="100%" position="relative" zIndex={1}>
                    <Box display="flex" alignItems="center" mb={2}>
                      <Avatar
                        sx={{
                          bgcolor: achievement.completed ? achievement.color : 'var(--text-secondary)',
                          width: 40,
                          height: 40,
                          flexShrink: 0,
                          boxShadow: achievement.completed ? `0 0 10px ${achievement.color}44` : 'none',
                        }}
                      >
                        {achievement.icon}
                      </Avatar>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          ml: 2, 
                          color: 'var(--text-primary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {achievement.title}
                      </Typography>
                    </Box>
                    <Box mt="auto">
                      <Box display="flex" alignItems="center" gap={1}>
                        <LinearProgress
                          variant="determinate"
                          value={achievement.progress}
                          sx={{
                            flexGrow: 1,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: 'var(--text-secondary)',
                            opacity: 0.2,
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: achievement.completed ? achievement.color : 'var(--primary)',
                            },
                          }}
                        />
                        <Typography
                          variant="body2"
                          sx={{
                            color: 'var(--text-secondary)',
                            minWidth: '40px',
                            textAlign: 'right',
                          }}
                        >
                          {Math.round(achievement.progress)}%
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Paper>
              </Tooltip>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
};

export default Achievements; 