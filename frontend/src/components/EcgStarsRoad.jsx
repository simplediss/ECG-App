import React from 'react';
import { Box, Tooltip, Typography, Stack } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';

const STAR_COUNT = 500;
const GROUP_SIZE = 50;

const ACC_AHA_TOOLTIP =
  'The American College of Cardiology and the American Heart Association (ACC/AHA) recommend a minimum of 500 supervised interpretations to learn how to interpret 12-lead ECGs, as well as 100 interpretations each year to maintain proficiency.';

const EcgStarsRoad = ({ correctAnswers = 0, scrollable = false }) => {
  // Clamp correctAnswers to [0, 500]
  const filledStars = Math.min(correctAnswers, STAR_COUNT);

  if (scrollable) {
    // Scrollable version: group by 50, horizontal Stack
    const groups = Array.from({ length: Math.ceil(STAR_COUNT / GROUP_SIZE) }, (_, i) => i);
    return (
      <Box sx={{ width: '100%', mb: 3 }}>
        <Tooltip title={ACC_AHA_TOOLTIP} arrow>
          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500, color: 'var(--text-primary)', cursor: 'help', textAlign: 'center' }}>
            ACC/AHA ECG Proficiency Road: {filledStars} / {STAR_COUNT} correct interpretations
          </Typography>
        </Tooltip>
        <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 1 }}>
          {groups.map((groupIdx) => {
            const start = groupIdx * GROUP_SIZE;
            const end = Math.min(start + GROUP_SIZE, STAR_COUNT);
            return (
              <Box key={groupIdx} display="flex" alignItems="center">
                {Array.from({ length: end - start }, (_, i) => {
                  const starIdx = start + i;
                  return (
                    <StarIcon
                      key={starIdx}
                      sx={{
                        fontSize: 18,
                        color: starIdx < filledStars ? '#FFD700' : 'var(--border-color)',
                        filter: starIdx < filledStars ? 'drop-shadow(0 0 4px #FFD70088)' : 'none',
                        transition: 'color 0.2s, filter 0.2s',
                      }}
                    />
                  );
                })}
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    textAlign: 'center',
                    color: 'var(--text-secondary)',
                    width: '100%',
                    mt: 0.5,
                  }}
                >
                  {start + 1}-{end}
                </Typography>
              </Box>
            );
          })}
        </Stack>
      </Box>
    );
  }

  // Default: grid version
  return (
    <Box sx={{ width: '100%', mb: 3 }}>
      <Tooltip title={ACC_AHA_TOOLTIP} arrow>
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500, color: 'var(--text-primary)', cursor: 'help', textAlign: 'center' }}>
          ACC/AHA ECG Proficiency Road: {filledStars} / {STAR_COUNT} correct interpretations
        </Typography>
      </Tooltip>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(8, 1fr)',
            sm: 'repeat(12, 1fr)',
            md: 'repeat(18, 1fr)',
            lg: 'repeat(25, 1fr)',
          },
          gap: { xs: 0.2, sm: 0.3, md: 0.5 },
          justifyItems: 'center',
          alignItems: 'center',
          width: '100%',
          maxWidth: '100%',
          mx: 'auto',
          userSelect: 'none',
          px: { xs: 1, sm: 2, md: 3 },
        }}
      >
        {Array.from({ length: STAR_COUNT }, (_, i) => (
          <StarIcon
            key={i}
            sx={{
              fontSize: { xs: 14, sm: 18, md: 22, lg: 28, xl: 32 },
              color: i < filledStars ? '#FFD700' : 'var(--border-color)',
              filter: i < filledStars ? 'drop-shadow(0 0 4px #FFD70088)' : 'none',
              transition: 'color 0.2s, filter 0.2s',
            }}
          />
        ))}
      </Box>
    </Box>
  );
};

export default EcgStarsRoad; 