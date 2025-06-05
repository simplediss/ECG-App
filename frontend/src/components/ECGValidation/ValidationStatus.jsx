import React from 'react';
import { Box, Chip, Tooltip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

const ValidationStatus = ({ validations }) => {
  if (!validations || validations.length === 0) {
    return (
      <Tooltip title="No validations yet">
        <Chip
          icon={<HelpOutlineIcon />}
          label="Not Validated"
          color="default"
          size="small"
        />
      </Tooltip>
    );
  }

  // Count valid and invalid validations
  const validCount = validations.filter(v => v.is_valid).length;
  const invalidCount = validations.filter(v => !v.is_valid).length;

  // If there are more valid than invalid validations, show as valid
  const isOverallValid = validCount >= invalidCount;

  return (
    <Box display="flex" alignItems="center" gap={1}>
      <Tooltip title={`${validCount} valid, ${invalidCount} invalid validations`}>
        <Chip
          icon={isOverallValid ? <CheckCircleIcon /> : <CancelIcon />}
          label={`${validCount}/${validations.length} Valid`}
          color={isOverallValid ? "success" : "error"}
          size="small"
        />
      </Tooltip>
    </Box>
  );
};

export default ValidationStatus; 