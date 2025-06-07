import React, { useEffect, useState } from 'react';
import { fetchValidations, updateValidation } from '../../api/validationApi';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogContent,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  DialogTitle,
  DialogActions,
  useTheme,
  useMediaQuery,
  Grid,
  Card,
  CardContent,
  Stack
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { getImageUrl } from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../api/axiosInstance';

const ValidationHistory = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useAuth();
  const [validations, setValidations] = useState([]);
  const [filteredValidations, setFilteredValidations] = useState([]);
  const [isFetching, setIsFetching] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [labelsError, setLabelsError] = useState(null);

  const [openImage, setOpenImage] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState('');

  const [filter, setFilter] = useState('all');

  const [allLabels, setAllLabels] = useState([]);
  const [openHistoryDialog, setOpenHistoryDialog] = useState(false);
  const [historyEntries, setHistoryEntries] = useState([]);
  const [historyParentId, setHistoryParentId] = useState(null);

  const [darkMode, setDarkMode] = useState(false);

  // ─── Fetch all possible labels on mount ───────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const resp = await axiosInstance.get('/validations/all_labels/');
        setAllLabels(resp.data.labels);
      } catch (err) {
        console.error('Error fetching labels:', err);
        setLabelsError('Failed to load labels. Some features may be limited.');
      }
    })();
  }, []);

  // ─── Fetch all past validations on mount ──────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        console.log('Fetching validations...');
        const data = await fetchValidations();
        console.log('Validations response:', data);
        setValidations(data.samples);
        setFilteredValidations(data.samples);
      } catch (err) {
        console.error('Error fetching validations:', err);
        setError('Failed to load validations');
      } finally {
        setIsFetching(false);
      }
    })();
  }, []);

  // ─── Filter into "all" / "mine" / "others" whenever user or validations changes ───
  useEffect(() => {
    if (filter === 'all') {
      setFilteredValidations(validations);
    } else if (filter === 'mine') {
      setFilteredValidations(validations.filter(v => 
        v.history.some(entry => entry.validated_by === user?.username)
      ));
    } else {
      // "others"
      setFilteredValidations(validations.filter(v => 
        !v.history.some(entry => entry.validated_by === user?.username)
      ));
    }
  }, [filter, validations, user]);

  // ─── Handlers for clicking the thumbnail & opening the image preview ────────────
  const handleImageClick = (samplePath) => {
    setModalImageUrl(getImageUrl(samplePath));
    setOpenImage(true);
  };

  const handleCloseHistoryDialog = () => {
    setOpenHistoryDialog(false);
    setHistoryEntries([]);
    setHistoryParentId(null);
  };

  // ─── Render a single row (either as a Card on mobile, or a TableRow on desktop) ──
  const renderValidationRow = (v) => {
    // ─── MOBILE CARD VERSION ──────────────────────────────────────────────────────
    if (isMobile) {
      return (
        <Card 
        name="validation-card"
        key={v.validation_id} 
        sx={{ mb: 2,
          backgroundColor: 'var(--bg-white)',
          '&:hover': {
            backgroundColor: 'var(--bg-white)',
            '& .MuiTableCell-root': {
              color: 'var(--text-light)',
            },
          },
         }}>
          <CardContent
          sx={{
            backgroundColor: 'var(--bg-white)',
            color:  'var(--text-primary)', 
            '& *': {
              color: 'var(--text-primary)',
            },
            '&:hover': {
              backgroundColor: 'var(--bg-white)',
              '& .MuiTableCell-root': {
                color: 'var(--text-light)',
              },
            },
          }}
          >
            <Grid container spacing={2}>
              <Grid xs={4}>
                <img
                  src={getImageUrl(v.path)}
                  alt={`ECG Sample ${v.sample_id}`}
                  style={{
                    width: '100%',
                    height: 'auto',
                    objectFit: 'cover',
                    cursor: 'pointer',
                    borderRadius: 4
                  }}
                  onClick={() => handleImageClick(v.sample_path)}
                />
              </Grid>
              <Grid xs={8}>
                <Stack spacing={1}>
                  <Typography variant="body2"><strong>Sample ID:</strong> {v.sample_id}</Typography>
                  <Typography variant="body2"><strong>Validated by:</strong> {v.history[0]?.validated_by || 'N/A'}</Typography> 
                  <Typography variant="body2"><strong>Valid:</strong> {v.prev_tag?.label_id === v.new_tag?.label_id ? '✅' : '❌'}</Typography>
                  <Typography variant="body2"><strong>Comments:</strong> {v.history[0]?.comment || '–'}</Typography>
                  <Typography variant="body2"><strong>Date:</strong> {new Date(v.history[0]?.created_at).toLocaleString()}</Typography>
                  <Typography variant="body2"><strong>Prev tag:</strong> {v.prev_tag?.label_desc || 'N/A'}</Typography>
                  <Typography variant="body2"><strong>New tag:</strong> {v.new_tag?.label_desc || 'N/A'}</Typography>
                  <Box
                  name="view-history-box"
                  >

                    <IconButton
                    name="view-history"
                      size="small"
                      onClick={() => {
                        setHistoryEntries(v.history || []);
                        setHistoryParentId(v);
                        setOpenHistoryDialog(true);
                      }}
                      sx={{
                        color: 'var(--text-primary)',
                        '&:hover': {
                          color: 'var(--primary)',
                        },
                      }}
                    >
                      <VisibilityIcon />
                    </IconButton>
                  </Box>
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      );
    }

    // ─── DESKTOP TABLE VERSION ────────────────────────────────────────────────────
    return (
      <TableRow 
      key={v.validation_id}
      sx={{
        backgroundColor: 'var(--bg-white)',
        '& .MuiTableCell-root': {
            color: 'var(--text-primary)',
        
        }}
      }
      >
        <TableCell
        
        >
          <img
            src={getImageUrl(v.path)}
            alt={`ECG Sample ${v.sample_id}`}
            style={{ width: '50px', height: '50px', objectFit: 'cover', cursor: 'pointer', borderRadius: 4 }}
            onClick={() => handleImageClick(v.path)}
          />
        </TableCell>
        <TableCell>
          
          {v.sample_id}
          </TableCell>
        <TableCell>
          
          {v.history[0]?.validated_by || 'N/A'}
          </TableCell>
        <TableCell>{v.prev_tag?.label_id === v.new_tag?.label_id ? '✅' : '❌'}</TableCell>
        <TableCell>{v.history[0]?.comment || '–'}</TableCell>
        <TableCell>{new Date(v.history[0]?.created_at).toLocaleString()}</TableCell>
        <TableCell>{v.prev_tag?.label_desc || 'N/A'}</TableCell>
        <TableCell>{v.new_tag?.label_desc || 'N/A'}</TableCell>
        <TableCell>
          <Stack direction="row" spacing={1}>
          <IconButton
                    name="view-history"
                      size="small"
                      onClick={() => {
                        setHistoryEntries(v.history || []);
                        setHistoryParentId(v);
                        setOpenHistoryDialog(true);
                      }}
                      sx={{
                        color: 'var(--text-primary)',
                        '&:hover': {
                          color: 'var(--primary)',
                        },
                      }}
                    >
                      <VisibilityIcon />
                    </IconButton>
          </Stack>
        </TableCell>
      </TableRow>
    );
  };

  // ─── SHOW SPINNER WHILE FETCHING ───────────────────────────────────────────────
  if (isFetching) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  // ─── SHOW ERROR MESSAGE ────────────────────────────────────────────────────────
  if (error || labelsError) {
    return (
      <Box mt={2}>
        {error && <Alert severity="error">{error}</Alert>}
        {labelsError && <Alert severity="warning">{labelsError}</Alert>}
      </Box>
    );
  }

  // ─── MAIN RENDER ───────────────────────────────────────────────────────────────
  return (
    <Box sx={{ p: { xs: 1, sm: 2 } }}>
      <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <Grid xs={12} sm={6}>
          <Typography variant="h6">Validated Samples</Typography>
        </Grid>
        <Grid xs={12} sm={6}>
          <FormControl fullWidth 
          variant="outlined"
          sx={
            {
              backgroundColor: 'var(--bg-white)', 
              borderRadius: 'var(--border-radius)',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'var(--border-color)'
              }
            }
          }>
            <InputLabel
            id="filter-label"
            sx={{
              color: 'var(--text-primary)',
              '&.Mui-focused': {
                color: 'var(--primary)'
              }
            }}
            >
            Filter by
            </InputLabel>
            
            <Select
              labelId="filter-label"
              value={filter}
              label="Filter by"
              onChange={(e) => setFilter(e.target.value)}

              MenuProps={{
                PaperProps: {
                  sx: {
                    backgroundColor: 'var(--bg-white)',
                    borderRadius: 'var(--border-radius)',
                    '& .MuiMenuItem-root': {
                      color: 'var(--text-primary)',
                      '&:hover': {
                        backgroundColor: 'var(--primary-light)',
                        color: 'var(--text-primary)',
                      },
                    },
                  },
                },
              }}
              sx={{
                color: 'var(--text-primary)',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'var(--primary)'
                },
                '&:hover': {
                  borderColor: 'var(--primary)',
                },
                '&.Mui-focused': {
                  borderColor: 'var(--primary)',
                },
                '& .MuiSvgIcon-root': {
                  color: 'var(--text-primary)',
                },
                
              }}
            >

            {['all', 'mine', 'others'].map((value) => ( 
              <MenuItem 
              key={value}
              value={value}
              sx={{
                color: 'var(--text-primary)',
                backgroundColor: 'inherit',
                  '&:hover, &.Mui-selected, &.Mui-selected:hover': {
                    backgroundColor: 'inherit',
                  },
                  
                  color: 'var(--primary)',
                
              }}
              >{value === 'all'
                ? 'All Changes'
                : value === 'mine'
                ? 'My Changes'
                : "Others' Changes"}
            </MenuItem>
            ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {isMobile ? (
        <Stack spacing={2}>
          {filteredValidations.map(renderValidationRow)}
        </Stack>
      ) : (
        <TableContainer 
        component={Paper} 
        sx={{ 
          maxHeight: '70vh', 
          overflowY: 'auto',
          backgroundColor: 'var(--bg-white)',
          }}>
          <Table stickyHeader>
            <TableHead
            >
              <TableRow
              sx={{
                backgroundColor: 'var(--bg-white)',
              }}
              >
                {['Sample', 'Sample ID', 'Validated by', 'Valid', 'Comments', 'Date', 'Prev tag', 'New tag', 'History'].map((header) => (
                  <TableCell
                  key={header}
                  sx={{
                    color: 'var(--text-secondary)',
                    fontWeight: 600,
                    backgroundColor: 'var(--bg-white)',
                    borderBottom: '1px solid var(--border-color)',
                  }}
                  >
                    {header}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
          
              {filteredValidations.map(renderValidationRow)}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* ─── Image Preview Dialog ──────────────────────────────────────────────────── */}
      <Dialog
        open={openImage}
        onClose={() => setOpenImage(false)}
        maxWidth="lg"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogContent sx={{ position: 'relative', p: 0 }}>
          <IconButton
            onClick={() => setOpenImage(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: 'white',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.7)' }
            }}
          >
            <CloseIcon />
          </IconButton>
          <img
            src={modalImageUrl}
            alt="ECG Full Size"
            style={{ width: '100%', height: 'auto', display: 'block' }}
          />
        </DialogContent>
      </Dialog>

      {/* ─── History Dialog ────────────────────────────────────────────────────────── */}
      <Dialog
        open={openHistoryDialog}
        onClose={handleCloseHistoryDialog}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            backgroundColor: 'var(--bg-white)',
            color: 'var(--text-primary)',
          }
        }}
      >
        <DialogTitle
          sx={{
            backgroundColor: 'var(--bg-white)',
            color: 'var(--text-primary)',
          }}
        >
          History for Sample #{historyParentId?.sample_id}
          <IconButton
            size="small"
            onClick={handleCloseHistoryDialog}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers
          sx={{
            backgroundColor: 'var(--bg-white)',
            color: 'var(--text-primary)',
          }}
        >
          {historyEntries.length === 0 ? (
            <Typography>No history recorded.</Typography>
          ) : (
            <Stack spacing={2}>
              {historyEntries.map((entry, idx) => (
                <Card key={idx} variant="outlined">
                  <CardContent>
                    <Stack spacing={1}>
                      <Typography variant="body2">
                        <strong>Validated at:</strong> {new Date(entry.created_at).toLocaleString()}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Validated by:</strong> {entry.validated_by || '–'}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Valid:</strong> {entry.prev_tag?.label_id === entry.new_tag?.label_id ? '✅ Valid' : '❌ Invalid'}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Comments:</strong> {entry.comment || '–'}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Previous Tag:</strong> {entry.prev_tag?.label_desc || '–'}
                      </Typography>
                      <Typography variant="body2">
                        <strong>New Tag:</strong> {entry.new_tag?.label_desc || '–'}
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseHistoryDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ValidationHistory;
