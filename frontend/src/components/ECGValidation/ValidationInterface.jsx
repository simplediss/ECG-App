import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { fetchPendingSamples as fetchPendingSamplesAPI, updateValidation } from '../../api/validationApi';
import { getImageUrl } from '../../api/axiosInstance';
import ListItemButton from '@mui/material/ListItemButton';
import axiosInstance from '../../api/axiosInstance';

import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  TextField,
  Alert,
  Grid,
  CircularProgress,
  ButtonGroup,
  Dialog,
  DialogContent,
  IconButton,
  Chip,
  Popover,
  List,
  ListItem,
  Paper,
  ListItemText,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { useTheme } from '../../context/ThemeContext';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import CloseIcon from '@mui/icons-material/Close';

const ValidationInterface = () => {
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const [pendingSamples, setPendingSamples] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isValid, setIsValid] = useState(false);
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [totalPending, setTotalPending] = useState(0);
  const [newTagId, setNewTagId] = useState(null);
  const [allLabels, setAllLabels] = useState([]);
  const [showTagSelection, setShowTagSelection] = useState(false);
  const [selectedTag, setSelectedTag] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);

  const currentSample = pendingSamples[currentIndex];

  const fetchPendingSamplesLocal = async () => {
    try {
      setLoading(true);
      const response = await fetchPendingSamplesAPI();
      console.log('Pending samples response:', response); // Debug log
      if (!response.samples || !Array.isArray(response.samples)) {
        console.error('Invalid response format:', response);
        setError('Invalid response format from server');
        return;
      }
      setPendingSamples(response.samples);
      setTotalPending(response.count);
      setCurrentIndex(0);
    } catch (err) {
      console.error('Error fetching pending samples:', err); // Debug log
      setError('Failed to fetch pending samples');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingSamplesLocal();
  }, []);

  useEffect(() => {
    const loadLabels = async () => {
      try {
        const response = await axiosInstance.get('/validations/all_labels/');
        setAllLabels(response.data.labels);
        console.log('All labels:', response.data.labels);
      } catch (err) {
        console.error('Error fetching labels:', err);
        setError('Failed to fetch available labels');
      }
    };
    loadLabels();
  }, []);

  useEffect(() => {
    if (currentSample) {
      console.log('Current sample:', currentSample);
    }
  }, [currentSample]);

  // Clear success message after 1 second
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleValidation = async (isValid = true, newTag = null) => {
    if (!currentSample) return;
    if (!isValid && !newTag) {
      setError('You must select a new label for invalid samples.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      await updateValidation(currentSample.id, {
        prev_tag_id: currentSample.prev_tag?.label_id,
        new_tag_id: isValid ? currentSample.prev_tag?.label_id : newTag,
        comment: comments
      });

      setSuccess(true);
      setComments('');
      setIsValid(false);
      handleNext();
      setTotalPending(prev => prev - 1);
    } catch (err) {
      console.error('Validation submission failed:', {
        sample: currentSample,
        sampleId: currentSample.id,
        error: err.response?.data || err.message,
        timestamp: new Date().toISOString()
      });

      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else if (err.response && err.response.data && err.response.data.sample) {
        setError(err.response.data.sample);
      } else {
        setError('Failed to submit validation');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < pendingSamples.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const getEcgImageUrl = (sample) => {
    if (!sample?.path) return null;
    // Ensure the path ends with .png
    console.log('Sample path:', sample.path);
    console.log('Sample path ends with .png:', sample.path.endsWith('.png'));
    console.log('Final URL:', getImageUrl(sample.path.endsWith('.png') ? sample.path : sample.path + '.png'));
    return getImageUrl(sample.path.endsWith('.png') ? sample.path : sample.path + '.png');
  };

  const handleInvalidClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleTagSelect = (tagId) => {
    handleValidation(false, tagId);
    setAnchorEl(null);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  if (loading && !currentSample) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (!currentSample) {
    return (
      <Box p={3}>
        <Alert severity="info">No pending samples to validate</Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Card sx={{ 
        backgroundColor: darkMode ? 'var(--bg-white)' : undefined,
        color: darkMode ? 'var(--text-primary)' : undefined,
        border: darkMode ? '1px solid var(--border-color)' : undefined,
        boxShadow: darkMode ? 'var(--box-shadow-sm)' : undefined,
        transition: 'all 0.3s ease',
      }}>
        <CardContent>
          <Grid container direction="column" spacing={3} justifyContent="center"  >
            <Grid xs={12}>
            
                <Typography color="primary" sx={{ color: darkMode ? 'var(--text-secondary)' : undefined }} align="center">
                  {totalPending} samples pending
                </Typography>
            
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h5" sx={{ color: darkMode ? 'var(--text-primary)' : undefined }}>
                  Sample {currentSample.id}
                </Typography>
                <Chip 
                    label={currentSample.prev_tag?.label_desc || "No label"}
                    color="primary"
                    variant="outlined"
                    sx={{
                      borderWidth: '2px',
                      transition: 'all 0.2s ease-in-out',
                      '& .MuiChip-label': {
                        px: 1.5,
                      }
                    }}
                  />
              </Box>
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
              <Grid item xs={12}>
                {success && <Alert severity="success" sx={{ mb: 2 }}>Validation submitted successfully</Alert>}
              </Grid>
            </Grid>

            <Grid container direction="row" xs={12}>
              <Box
                component="img"
                src={getEcgImageUrl(currentSample)}
                
                alt={`ECG Sample ${currentSample.id}`}
                sx={{
                  width: '100%',
                  height: 'auto',
                  maxHeight: { xs: '300px', sm: '400px', md: '500px' },
                  objectFit: 'contain',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
                onClick={() => setShowImageModal(true)}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/placeholder-ecg.svg';
                }}
              />
            </Grid>

            

            <Grid container direction="row" xs={12} justifyContent="center">
              <Box 
                display="flex" 
                flexDirection="column"
                alignItems="center"
                gap={2}
                width="100%"
              >
                <ButtonGroup size="small">
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={handleInvalidClick}
                    disabled={loading}
                    startIcon={<CancelIcon />}
                  >
                    Invalid
                  </Button>
                  <Button
                    variant="outlined"
                    color="success"
                    onClick={() => handleValidation(true)}
                    disabled={loading}
                    endIcon={<CheckCircleIcon />}
                  >
                    Valid
                  </Button>
                </ButtonGroup>

                <ButtonGroup size="small">
                  <Button
                    variant="outlined"
                    onClick={handlePrev}
                    disabled={currentIndex === 0 || loading}
                  >
                    <NavigateBeforeIcon />
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handleNext}
                    disabled={currentIndex === pendingSamples.length - 1 || loading}
                  >
                    <NavigateNextIcon />
                  </Button>
                </ButtonGroup>
              </Box>
            </Grid>

            <Popover
              open={Boolean(anchorEl)}
              anchorEl={anchorEl}
              onClose={handleClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
            >
              <List sx={{ width: 300, maxHeight: 400, overflow: 'auto' }}>
                {allLabels.map((label, index) => (
                  <ListItem key={index} disablePadding>
                    <ListItemButton onClick={() => handleTagSelect(label.label_id)}>
                      <ListItemText primary={label.label_desc} />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Popover>

            <Grid xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Comment (optional)"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Add any comments about the sample..."
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: 'var(--text-primary)',
                    '& fieldset': {
                      borderColor: 'var(--border-color)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'var(--primary)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'var(--primary)',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'var(--text-secondary)',
                    '&.Mui-focused': {
                      color: 'var(--primary)',
                    },
                  },
                  '& .MuiInputBase-input': {
                    color: 'var(--text-primary)',
                  },
                }}
              />
            </Grid>

          </Grid>
        </CardContent>
      </Card>

      {/* Image Modal */}
      <Dialog
        open={showImageModal}
        onClose={() => setShowImageModal(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogContent sx={{ position: 'relative', p: 0 }}>
          <IconButton
            onClick={() => setShowImageModal(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: 'white',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
              },
            }}
          >
            <CloseIcon />
          </IconButton>
          <Box
            component="img"
            src={getEcgImageUrl(currentSample)}
            alt={`ECG Sample ${currentSample.id} (Full Size)`}
            sx={{
              width: '100%',
              height: 'auto',
              display: 'block',
            }}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/placeholder-ecg.svg';
            }}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default ValidationInterface; 