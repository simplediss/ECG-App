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

  const [openImage, setOpenImage] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState('');

  const [filter, setFilter] = useState('all');

  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editingValidation, setEditingValidation] = useState(null);
  const [editForm, setEditForm] = useState({ is_valid: true, comments: '', new_tag_id: '' });

  const [allLabels, setAllLabels] = useState([]);
  const [openHistoryDialog, setOpenHistoryDialog] = useState(false);
  const [historyEntries, setHistoryEntries] = useState([]);
  const [historyParentId, setHistoryParentId] = useState(null);

  // ─── Fetch all possible labels on mount ───────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const resp = await axiosInstance.get('/validations/all_labels/');
        setAllLabels(resp.data.labels);
      } catch (err) {
        console.error('Error fetching labels:', err);
      }
    })();
  }, []);

  // ─── Fetch all past validations on mount ──────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const data = await fetchValidations();
        setValidations(data.samples);
        setFilteredValidations(data.samples);
      } catch (err) {
        setError('Failed to load validations');
      } finally {
        setIsFetching(false);
      }
    })();
  }, []);

  // ─── Filter into “all” / “mine” / “others” whenever user or validations changes ───
  useEffect(() => {
    if (filter === 'all') {
      setFilteredValidations(validations);
    } else if (filter === 'mine') {
      setFilteredValidations(validations.filter(v => v.teacher?.username === user?.username));
    } else {
      // “others”
      setFilteredValidations(validations.filter(v => v.teacher?.username !== user?.username));
    }
  }, [filter, validations, user]);

  // ─── Handlers for clicking the thumbnail & opening the image preview ────────────
  const handleImageClick = (samplePath) => {
    setModalImageUrl(getImageUrl(samplePath));
    setOpenImage(true);
  };

  // ─── When “Edit” is clicked, prefill the form with the chosen validation record ───
  const handleEditClick = (validation) => {
    setEditingValidation(validation);
    setEditForm({
      is_valid: validation.is_valid,
      comments: validation.comments || '',
      // Always default to the existing "new_tag" if set; otherwise use curr_tag
      new_tag_id: String(validation.new_label?.id || validation.curr_label?.id || '')
    });
    setOpenEditDialog(true);
  };

  // ─── When “Save Changes” is clicked, PATCH & update local state ────────────────
  const handleEditSubmit = async () => {
    setIsSubmitting(true);
    try {
      const updatedValidation = await updateValidation(editingValidation.validation_id, {
        is_valid: editForm.is_valid,
        comments: editForm.comments,
        new_tag_id: editForm.new_tag_id
      });

      // Update local state to reflect new data:
      setValidations(prevValidations =>
        prevValidations.map(v =>
          v.validation_id === editingValidation.validation_id
            ? {
                ...v,
                is_valid: updatedValidation.is_valid,
                comments: updatedValidation.comments,
                new_label: {
                  id: updatedValidation.new_tag.id,
                  desc: updatedValidation.new_tag.label_desc
                }
              }
            : v
        )
      );

      setOpenEditDialog(false);
      setEditingValidation(null);
    } catch (err) {
      setError('Failed to update validation');
    } finally {
      setIsSubmitting(false);
    }
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
          <CardContent>
            <Grid container spacing={2}>
              <Grid xs={4}>
                <img
                  src={getImageUrl(v.sample_path)}
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
                  <Typography variant="body2"><strong>Validated by:</strong> {v.teacher?.username || 'N/A'}</Typography>
                  <Typography variant="body2"><strong>Valid:</strong> {v.is_valid ? '✅' : '❌'}</Typography>
                  <Typography variant="body2"><strong>Comments:</strong> {v.comments || '–'}</Typography>
                  <Typography variant="body2"><strong>Date:</strong> {new Date(v.validated_at).toLocaleString()}</Typography>
                  <Typography variant="body2"><strong>Prev tag:</strong> {v.curr_label?.label_desc || 'N/A'}</Typography>
                  <Typography variant="body2"><strong>New tag:</strong> {v.new_label?.label_desc || 'N/A'}</Typography>
                  <Box>
                    {/* Only teachers or staff can see the pencil */}
                    {(user?.profile?.role === 'teacher' || user?.is_staff) && (
                      <IconButton 
                      size="small" 
                      onClick={() => handleEditClick(v)} 
                      color="--primary" 
                      sx={{ 
                        mr: 1,
                        '&:hover': {
                          color: 'var(--primary)',
                        },
                      }}>
                        <EditIcon />
                      </IconButton>
                    )}
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        setHistoryEntries(v.history || []);
                        setHistoryParentId(v.validation_id);
                        setOpenHistoryDialog(true);
                      }}
                    >
                      View History
                    </Button>
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
            src={getImageUrl(v.sample_path)}
            alt={`ECG Sample ${v.sample_id}`}
            style={{ width: '50px', height: '50px', objectFit: 'cover', cursor: 'pointer', borderRadius: 4 }}
            onClick={() => handleImageClick(v.sample_path)}
          />
        </TableCell>
        <TableCell>
          
          {v.sample_id}
          </TableCell>
        <TableCell>
          
          {v.teacher?.username || 'N/A'}
          </TableCell>
        <TableCell>{v.is_valid ? '✅' : '❌'}</TableCell>
        <TableCell>{v.comments || '–'}</TableCell>
        <TableCell>{new Date(v.validated_at).toLocaleString()}</TableCell>
        <TableCell>{v.curr_label?.label_desc || 'N/A'}</TableCell>
        <TableCell>{v.new_label?.label_desc || 'N/A'}</TableCell>
        <TableCell>
          <Stack direction="row" spacing={1}>
            {(user?.profile?.role === 'teacher' || user?.is_staff) && (
              <IconButton size="small" onClick={() => handleEditClick(v)} color="primary">
                <EditIcon />
              </IconButton>
            )}
            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                setHistoryEntries(v.history || []);
                setHistoryParentId(v.validation_id);
                setOpenHistoryDialog(true);
              }}
            >
              View History
            </Button>
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
  if (error) {
    return (
      <Box mt={2}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  // ─── MAIN RENDER ───────────────────────────────────────────────────────────────
  return (
    <Box sx={{ p: { xs: 1, sm: 2 } }}>
      <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
        <Grid xs={12} sm={6}>
          <Typography variant="h6">Past Validations</Typography>
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
                ? 'All Validations'
                : value === 'mine'
                ? 'My Validations'
                : "Others' Validations"}
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
                {['Sample', 'Sample ID', 'Validated by', 'Valid', 'Comments', 'Date', 'Prev tag', 'New tag', 'Review'].map((header) => (
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

      {/* ─── Edit Validation Dialog ────────────────────────────────────────────────── */}
      <Dialog
        open={openEditDialog}
        onClose={() => setOpenEditDialog(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>Edit Validation</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Validation Status</InputLabel>
              <Select
                value={editForm.is_valid}
                label="Validation Status"
                onChange={(e) => setEditForm(prev => ({ ...prev, is_valid: e.target.value }))}
              >
                <MenuItem value={true}>Valid</MenuItem>
                <MenuItem value={false}>Invalid</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>New Label</InputLabel>
              <Select
                value={editForm.new_tag_id || ''}
                label="New Label"
                onChange={(e) => setEditForm(prev => ({ ...prev, new_tag_id: e.target.value }))}
              >
                {allLabels.map(label => (
                  <MenuItem key={label.label_id} value={String(label.label_id)}>
                    {label.label_desc}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Comments"
              multiline
              rows={4}
              value={editForm.comments}
              onChange={(e) => setEditForm(prev => ({ ...prev, comments: e.target.value }))}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleEditSubmit}
            variant="contained"
            color="primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? <CircularProgress size={18} /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── History Dialog ────────────────────────────────────────────────────────── */}
      <Dialog
        open={openHistoryDialog}
        onClose={() => setOpenHistoryDialog(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>
          History for Validation #{historyParentId}
          <IconButton
            size="small"
            onClick={() => setOpenHistoryDialog(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {historyEntries.length === 0 ? (
            <Typography>No history recorded.</Typography>
          ) : (
            <Stack spacing={2}>
              {historyEntries.map((entry, idx) => (
                <Card key={idx} variant="outlined">
                  <CardContent>
                    <Stack spacing={1}>
                      <Typography variant="body2">
                        <strong>Changed at:</strong> {new Date(entry.changed_at).toLocaleString()}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Changed by:</strong> {entry.changed_by || '–'}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Valid?</strong> {entry.is_valid ? '✅ Valid' : '❌ Invalid'}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Comments:</strong> {entry.comments || '–'}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Prev Tag:</strong> {entry.curr_tag_desc || '–'}
                      </Typography>
                      <Typography variant="body2">
                        <strong>New Tag:</strong> {entry.new_tag_desc || '–'}
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenHistoryDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ValidationHistory;
