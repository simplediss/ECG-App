import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tooltip,
  IconButton,
  Badge,
  Avatar,
  Grid,
} from '@mui/material';
import {
  LocalFireDepartment as FireIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { getStudentQuizAttempts } from '../api/userApi';
import { useAuth } from '../context/AuthContext';
import { keyframes } from '@emotion/react';

// Fire animation keyframes
const fireAnimation = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const StreakCounter = () => {
  const { user } = useAuth();
  const [streak, setStreak] = useState(0);
  const [lastActiveDate, setLastActiveDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const calculateStreak = async () => {
      try {
        if (!user || !user.username) {
          setStreak(0);
          setLoading(false);
          return;
        }
        const attempts = await getStudentQuizAttempts(user.username);
        if (!attempts || attempts.length === 0) {
          setStreak(0);
          setLoading(false);
          return;
        }

        // Sort attempts by date
        const sortedAttempts = attempts.sort((a, b) => 
          new Date(b.completed_at) - new Date(a.completed_at)
        );

        // Get the last active date
        const lastAttempt = sortedAttempts[0];
        setLastActiveDate(new Date(lastAttempt.completed_at));

        // Calculate streak
        let currentStreak = 0;
        let currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);

        // Check if the last attempt was today or yesterday
        const lastAttemptDate = new Date(lastAttempt.completed_at);
        lastAttemptDate.setHours(0, 0, 0, 0);
        
        const dayDifference = Math.floor((currentDate - lastAttemptDate) / (1000 * 60 * 60 * 24));
        
        if (dayDifference > 1) {
          // Streak broken
          setStreak(0);
          setLoading(false);
          return;
        }

        // Count consecutive days
        let checkDate = new Date(lastAttemptDate);
        while (true) {
          const hasAttemptOnDate = sortedAttempts.some(attempt => {
            const attemptDate = new Date(attempt.completed_at);
            attemptDate.setHours(0, 0, 0, 0);
            return attemptDate.getTime() === checkDate.getTime();
          });

          if (!hasAttemptOnDate) break;
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        }

        setStreak(currentStreak);
      } catch (err) {
        setError('Failed to load streak data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    calculateStreak();
  }, [user]);

  if (loading) {
    return null;
  }

  if (error) {
    return null;
  }

  return (
    <Tooltip
      title={streak > 0 
        ? 'Keep it up! Complete a quiz today to maintain your streak.'
        : 'Start your streak by completing a quiz today!'}
      arrow
    >
      <Box display="flex" alignItems="center" gap={1}>
        <Avatar
          sx={{
            bgcolor: streak > 0 ? 'var(--primary)' : 'var(--text-secondary)',
            width: { xs: 32, sm: 40 },
            height: { xs: 32, sm: 40 },
          }}
        >
          <FireIcon sx={{ fontSize: { xs: 20, sm: 28 }, color: 'var(--primary-light)'}} />
        </Avatar>
        <Typography 
          variant="h6" 
          sx={{ 
            color: 'var(--text-primary)',
            fontSize: { xs: '1rem', sm: '1.25rem' },
            fontWeight: 600
          }}
        >
          {streak} Day{streak !== 1 ? 's' : ''}
        </Typography>
      </Box>
    </Tooltip>
  );
};

export default StreakCounter; 