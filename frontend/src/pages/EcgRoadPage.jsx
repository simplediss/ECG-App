import React, { useEffect, useState } from 'react';
import { Container, Typography, Box, LinearProgress } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { getUserStatistics } from '../api/statistics';
import EcgStarsRoad from '../components/EcgStarsRoad';

const EcgRoadPage = () => {
  const { user } = useAuth();
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const stats = await getUserStatistics(user.id);
        setStatistics(stats);
      } catch (err) {
        setError('Failed to load statistics');
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchStats();
  }, [user]);

  return (
    <Container maxWidth="md" sx={{ mt: 6, mb: 6 }}>
      <Typography variant="h3" align="center" gutterBottom sx={{ fontWeight: 700, color: 'var(--primary)' }}>
        ECG Proficiency Road
      </Typography>
      <Typography variant="h6" align="center" sx={{ mb: 4, color: 'var(--text-primary)' }}>
        Track your journey to 500 supervised ECG interpretations, as recommended by the ACC/AHA.
      </Typography>
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <LinearProgress />
        </Box>
      ) : error ? (
        <Box p={3}><Typography color="error">{error}</Typography></Box>
      ) : (
        <EcgStarsRoad correctAnswers={statistics?.correct_answers || 0} />
      )}
      <Box mt={4} textAlign="center">
        <Typography variant="body1" color="var(--text-secondary)">
          The American College of Cardiology and the American Heart Association (ACC/AHA) recommend a minimum of 500 supervised interpretations to learn how to interpret 12-lead ECGs, as well as 100 interpretations each year to maintain proficiency.
        </Typography>
      </Box>
    </Container>
  );
};

export default EcgRoadPage; 