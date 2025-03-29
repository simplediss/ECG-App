import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  TextField,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Alert,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  PersonAdd as PersonAddIcon,
  PersonRemove as PersonRemoveIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  PendingOutlined as PendingIcon,
} from '@mui/icons-material';

// Configure axios defaults
axios.defaults.baseURL = 'http://localhost:8000';
axios.defaults.withCredentials = true;

const Groups = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pendingRequests, setPendingRequests] = useState({});
  const [myPendingRequests, setMyPendingRequests] = useState([]);

  const fetchGroups = async () => {
    try {
      const response = await axios.get('/api/groups/');
      setGroups(response.data);
    } catch (err) {
      setError('Failed to fetch groups');
      console.error('Error fetching groups:', err);
    }
  };

  const fetchMyGroups = async () => {
    try {
      const response = await axios.get('/api/groups/my_groups/');
      setMyGroups(response.data);
    } catch (err) {
      setError('Failed to fetch your groups');
      console.error('Error fetching my groups:', err);
    }
  };

  const fetchPendingRequests = async () => {
    if (user.profile?.role === 'teacher') {
      try {
        const response = await axios.get('/api/group-requests/');
        // Organize requests by group ID
        const requestsByGroup = {};
        response.data.forEach(request => {
          if (!requestsByGroup[request.group]) {
            requestsByGroup[request.group] = [];
          }
          requestsByGroup[request.group].push(request);
        });
        setPendingRequests(requestsByGroup);
      } catch (err) {
        console.error('Error fetching pending requests:', err);
      }
    }
  };

  const fetchMyPendingRequests = async () => {
    if (user.profile?.role === 'student') {
      try {
        const response = await axios.get('/api/group-requests/');
        setMyPendingRequests(response.data.map(request => request.group));
      } catch (err) {
        console.error('Error fetching my pending requests:', err);
      }
    }
  };

  useEffect(() => {
    fetchGroups();
    fetchMyGroups();
    fetchPendingRequests();
    fetchMyPendingRequests();
  }, [user.profile?.role]);

  const handleCreateGroup = async () => {
    try {
      await axios.post('/api/groups/', { name: newGroupName });
      setNewGroupName('');
      setOpenCreateDialog(false);
      fetchGroups();
      fetchMyGroups();
      setSuccess('Group created successfully');
    } catch (err) {
      setError('Failed to create group');
      console.error('Error creating group:', err);
    }
  };

  const handleDeleteGroup = async (groupId) => {
    try {
      await axios.delete(`/api/groups/${groupId}/`);
      fetchGroups();
      fetchMyGroups();
      setSuccess('Group deleted successfully');
      setOpenDeleteDialog(false);
      setGroupToDelete(null);
    } catch (err) {
      setError('Failed to delete group');
      console.error('Error deleting group:', err);
    }
  };

  const handleJoinRequest = async (groupId) => {
    try {
      await axios.post(`/api/groups/${groupId}/join_request/`);
      fetchGroups();
      setSuccess('Join request sent successfully');
    } catch (err) {
      setError('Failed to send join request');
      console.error('Error sending join request:', err);
    }
  };

  const handleApproveRequest = async (groupId, requestId) => {
    try {
      console.log('Approving request:', { groupId, requestId }); // Debug log
      await axios.post(`/api/groups/${groupId}/approve_request/`, { request_id: requestId });
      fetchGroups();
      fetchMyGroups();
      fetchPendingRequests(); // Add this to refresh the pending requests
      setSuccess('Request approved successfully');
    } catch (err) {
      console.error('Error approving request:', err.response?.data || err); // Enhanced error logging
      setError(err.response?.data?.error || 'Failed to approve request');
    }
  };

  const handleRejectRequest = async (groupId, requestId) => {
    try {
      await axios.post(`/api/groups/${groupId}/reject_request/`, { request_id: requestId });
      fetchGroups();
      setSuccess('Request rejected successfully');
    } catch (err) {
      setError('Failed to reject request');
      console.error('Error rejecting request:', err);
    }
  };

  const handleRemoveUser = async (groupId, userId) => {
    try {
      await axios.post(`/api/groups/${groupId}/remove_user/`, { user_id: userId });
      fetchGroups();
      fetchMyGroups();
      setSuccess('User removed successfully');
    } catch (err) {
      setError('Failed to remove user');
      console.error('Error removing user:', err);
    }
  };

  const renderPendingRequestsTable = (groupId) => {
    const requests = pendingRequests[groupId] || [];
    if (requests.length === 0) {
      return (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
          No pending requests
        </Typography>
      );
    }

    return (
      <TableContainer component={Paper} sx={{ mt: 2, mb: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Username</TableCell>
              <TableCell>Full Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {requests.map((request) => (
              <TableRow key={request.id}>
                <TableCell>{request.student_name}</TableCell>
                <TableCell>
                  {request.student_first_name} {request.student_last_name}
                </TableCell>
                <TableCell>{request.student_email}</TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    color="success"
                    onClick={() => handleApproveRequest(groupId, request.id)}
                    title="Approve"
                  >
                    <CheckIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleRejectRequest(groupId, request.id)}
                    title="Reject"
                  >
                    <CloseIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Groups
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      {user.profile?.role === 'teacher' && (
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenCreateDialog(true)}
          sx={{ mb: 3 }}
        >
          Create New Group
        </Button>
      )}

      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        My Groups
      </Typography>
      <List>
        {myGroups.map((group) => (
          <Card key={group.id} sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6">{group.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                Created by: {group.teacher_name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Members: {group.member_count}
              </Typography>
              {user.profile?.role === 'teacher' && group.teacher === user.id && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Pending Requests
                  </Typography>
                  {renderPendingRequestsTable(group.id)}
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => {
                      setGroupToDelete(group.id);
                      setOpenDeleteDialog(true);
                    }}
                    sx={{ mt: 2 }}
                  >
                    Delete Group
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        ))}
      </List>

      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        Available Groups
      </Typography>
      <List>
        {groups
          .filter((group) => !myGroups.some((myGroup) => myGroup.id === group.id))
          .map((group) => (
            <Card key={group.id} sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <Typography variant="h6">{group.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Created by: {group.teacher_name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Members: {group.member_count}
                    </Typography>
                  </div>
                  {user.profile?.role === 'student' && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {myPendingRequests.includes(group.id) ? (
                        <Chip
                          icon={<PendingIcon />}
                          label="Request Pending"
                          color="warning"
                          variant="outlined"
                        />
                      ) : (
                        <Button
                          variant="outlined"
                          startIcon={<PersonAddIcon />}
                          onClick={() => handleJoinRequest(group.id)}
                        >
                          Request to Join
                        </Button>
                      )}
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          ))}
      </List>

      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)}>
        <DialogTitle>Create New Group</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Group Name"
            fullWidth
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateGroup} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openDeleteDialog}
        onClose={() => {
          setOpenDeleteDialog(false);
          setGroupToDelete(null);
        }}
      >
        <DialogTitle>Delete Group</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this group? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setOpenDeleteDialog(false);
              setGroupToDelete(null);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => handleDeleteGroup(groupToDelete)}
            color="error"
            variant="contained"
            autoFocus
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Groups; 