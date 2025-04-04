import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosInstance';
import { useTheme } from '../context/ThemeContext';
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
  IconButton,
  Chip,
  Alert,
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


const Groups = () => {
  const { user } = useAuth();
  const { darkMode } = useTheme();
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
  const [groupMembers, setGroupMembers] = useState({});

  const fetchGroups = async () => {
    try {
      const response = await axiosInstance.get('/groups/');
      setGroups(response.data);
    } catch (err) {
      setError('Failed to fetch groups');
      console.error('Error fetching groups:', err);
    }
  };

  const fetchMyGroups = async () => {
    try {
      const response = await axiosInstance.get('/groups/my_groups/');
      setMyGroups(response.data);
    } catch (err) {
      setError('Failed to fetch your groups');
      console.error('Error fetching my groups:', err);
    }
  };

  const fetchPendingRequests = async () => {
    if (user.profile?.role === 'teacher') {
      try {
        const response = await axiosInstance.get('/group-requests/');
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
        const response = await axiosInstance.get('/group-requests/');
        setMyPendingRequests(response.data.map(request => request.group));
      } catch (err) {
        console.error('Error fetching my pending requests:', err);
      }
    }
  };

  const fetchGroupMembers = async (groupId) => {
    try {
      const response = await axiosInstance.get(`/groups/${groupId}/`);
      setGroupMembers(prev => {
        const newState = {
          ...prev,
          [groupId]: response.data.members
        };
        return newState;
      });
    } catch (err) {
      console.error('Error fetching group members:', err);
    }
  };

  useEffect(() => {
    fetchGroups();
    fetchMyGroups();
    fetchPendingRequests();
    fetchMyPendingRequests();
  }, [user.profile?.role]);

  // Separate useEffect for fetching group members
  useEffect(() => {
    if (user.profile?.role === 'teacher' && myGroups.length > 0) {
      myGroups.forEach(group => {
        fetchGroupMembers(group.id);
      });
    }
  }, [myGroups, user.profile?.role]);

  const handleCreateGroup = async () => {
    try {
      await axiosInstance.post('/groups/', { name: newGroupName });
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
      await axiosInstance.delete(`/groups/${groupId}/`);
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
      await axiosInstance.post(`/groups/${groupId}/join_request/`);
      fetchGroups();
      setSuccess('Join request sent successfully');
    } catch (err) {
      setError('Failed to send join request');
      console.error('Error sending join request:', err);
    }
  };

  const handleApproveRequest = async (groupId, requestId) => {
    try {
      await axiosInstance.post(`/groups/${groupId}/approve_request/`, { request_id: requestId });
      fetchGroups();
      fetchMyGroups();
      fetchPendingRequests(); // Add this to refresh the pending requests
      fetchGroupMembers(groupId); // Refresh the members list
      setSuccess('Request approved successfully');
    } catch (err) {
      console.error('Error approving request:', err.response?.data || err); // Enhanced error logging
      setError(err.response?.data?.error || 'Failed to approve request');
    }
  };

  const handleRejectRequest = async (groupId, requestId) => {
    try {
      await axiosInstance.post(`/groups/${groupId}/reject_request/`, { request_id: requestId });
      fetchGroups();
      fetchPendingRequests(); // Refresh pending requests
      setSuccess('Request rejected successfully');
    } catch (err) {
      setError('Failed to reject request');
      console.error('Error rejecting request:', err);
    }
  };

  const handleRemoveUser = async (groupId, userId) => {
    try {
      await axiosInstance.post(`/groups/${groupId}/remove_user/`, { user_id: userId });
      fetchGroups();
      fetchMyGroups();
      fetchGroupMembers(groupId); // Refresh the members list
      setSuccess('User removed successfully');
    } catch (err) {
      setError('Failed to remove user');
      console.error('Error removing user:', err);
    }
  };

  const renderGroupMembersTable = (groupId) => {
    const members = groupMembers[groupId] || [];
    if (!members || members.length === 0) {
      return (
        <Typography 
          variant="body2" 
          sx={{ 
            mt: 1, 
            fontStyle: 'italic',
            color: darkMode ? 'var(--text-secondary)' : 'text.secondary'
          }}
        >
          No members in this group
        </Typography>
      );
    }

    return (
      <TableContainer 
        component={Paper} 
        sx={{ 
          mt: 2, 
          mb: 2,
          backgroundColor: darkMode ? 'var(--bg-main)' : undefined,
          color: darkMode ? 'var(--text-primary)' : undefined,
          border: darkMode ? '1px solid var(--border-color)' : undefined,
          boxShadow: darkMode ? 'var(--box-shadow-sm)' : undefined,
        }}
      >
        <Table size="small">
          <TableHead sx={{ backgroundColor: darkMode ? 'var(--bg-main)' : undefined }}>
            <TableRow>
              <TableCell sx={{ color: darkMode ? 'var(--text-primary)' : undefined, fontWeight: '600', borderBottom: darkMode ? '1px solid var(--border-color)' : undefined }}>Username</TableCell>
              <TableCell sx={{ color: darkMode ? 'var(--text-primary)' : undefined, fontWeight: '600', borderBottom: darkMode ? '1px solid var(--border-color)' : undefined }}>Full Name</TableCell>
              <TableCell sx={{ color: darkMode ? 'var(--text-primary)' : undefined, fontWeight: '600', borderBottom: darkMode ? '1px solid var(--border-color)' : undefined }}>Email</TableCell>
              <TableCell align="right" sx={{ color: darkMode ? 'var(--text-primary)' : undefined, fontWeight: '600', borderBottom: darkMode ? '1px solid var(--border-color)' : undefined }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.id} sx={{ 
                '&:hover': { backgroundColor: darkMode ? 'var(--bg-white)' : undefined },
                borderBottom: darkMode ? '1px solid var(--border-color)' : undefined
              }}>
                <TableCell sx={{ color: darkMode ? 'var(--text-primary)' : undefined, borderBottom: darkMode ? '1px solid var(--border-color)' : undefined }}>{member.username}</TableCell>
                <TableCell sx={{ color: darkMode ? 'var(--text-primary)' : undefined, borderBottom: darkMode ? '1px solid var(--border-color)' : undefined }}>
                  {member.first_name} {member.last_name}
                </TableCell>
                <TableCell sx={{ color: darkMode ? 'var(--text-primary)' : undefined, borderBottom: darkMode ? '1px solid var(--border-color)' : undefined }}>{member.email}</TableCell>
                <TableCell align="right" sx={{ borderBottom: darkMode ? '1px solid var(--border-color)' : undefined }}>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleRemoveUser(groupId, member.id)}
                    title="Remove from group"
                    sx={{ backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : undefined }}
                  >
                    <PersonRemoveIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const renderPendingRequestsTable = (groupId) => {
    const requests = pendingRequests[groupId] || [];
    if (requests.length === 0) {
      return (
        <Typography 
          variant="body2" 
          sx={{ 
            mt: 1, 
            fontStyle: 'italic',
            color: darkMode ? 'var(--text-secondary)' : 'text.secondary'
          }}
        >
          No pending requests
        </Typography>
      );
    }

    return (
      <TableContainer 
        component={Paper} 
        sx={{ 
          mt: 2, 
          mb: 2,
          backgroundColor: darkMode ? 'var(--bg-main)' : undefined,
          color: darkMode ? 'var(--text-primary)' : undefined,
          border: darkMode ? '1px solid var(--border-color)' : undefined,
          boxShadow: darkMode ? 'var(--box-shadow-sm)' : undefined,
        }}
      >
        <Table size="small">
          <TableHead sx={{ backgroundColor: darkMode ? 'var(--bg-main)' : undefined }}>
            <TableRow>
              <TableCell sx={{ color: darkMode ? 'var(--text-primary)' : undefined, fontWeight: '600', borderBottom: darkMode ? '1px solid var(--border-color)' : undefined }}>Username</TableCell>
              <TableCell sx={{ color: darkMode ? 'var(--text-primary)' : undefined, fontWeight: '600', borderBottom: darkMode ? '1px solid var(--border-color)' : undefined }}>Full Name</TableCell>
              <TableCell sx={{ color: darkMode ? 'var(--text-primary)' : undefined, fontWeight: '600', borderBottom: darkMode ? '1px solid var(--border-color)' : undefined }}>Email</TableCell>
              <TableCell align="right" sx={{ color: darkMode ? 'var(--text-primary)' : undefined, fontWeight: '600', borderBottom: darkMode ? '1px solid var(--border-color)' : undefined }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {requests.map((request) => (
              <TableRow key={request.id} sx={{ 
                '&:hover': { backgroundColor: darkMode ? 'var(--bg-white)' : undefined },
                borderBottom: darkMode ? '1px solid var(--border-color)' : undefined
              }}>
                <TableCell sx={{ color: darkMode ? 'var(--text-primary)' : undefined, borderBottom: darkMode ? '1px solid var(--border-color)' : undefined }}>{request.student_name}</TableCell>
                <TableCell sx={{ color: darkMode ? 'var(--text-primary)' : undefined, borderBottom: darkMode ? '1px solid var(--border-color)' : undefined }}>
                  {request.student_first_name} {request.student_last_name}
                </TableCell>
                <TableCell sx={{ color: darkMode ? 'var(--text-primary)' : undefined, borderBottom: darkMode ? '1px solid var(--border-color)' : undefined }}>{request.student_email}</TableCell>
                <TableCell align="right" sx={{ borderBottom: darkMode ? '1px solid var(--border-color)' : undefined }}>
                  <IconButton
                    size="small"
                    color="success"
                    onClick={() => handleApproveRequest(groupId, request.id)}
                    title="Approve"
                    sx={{ backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : undefined, mr: 1 }}
                  >
                    <CheckIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleRejectRequest(groupId, request.id)}
                    title="Reject"
                    sx={{ backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : undefined }}
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
    <Box sx={{ p: 3, backgroundColor: darkMode ? 'var(--bg-main)' : undefined }}>
      <Typography variant="h4" gutterBottom sx={{ color: darkMode ? 'var(--text-primary)' : undefined }}>
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

      <Typography variant="h5" gutterBottom sx={{ mt: 4, color: darkMode ? 'var(--text-primary)' : undefined }}>
        My Groups
      </Typography>
      <List>
        {myGroups.map((group) => (
          <Card 
            key={group.id} 
            sx={{ 
              mb: 2,
              backgroundColor: darkMode ? 'var(--bg-white)' : undefined,
              color: darkMode ? 'var(--text-primary)' : undefined,
              border: darkMode ? '1px solid var(--border-color)' : undefined,
              boxShadow: darkMode ? 'var(--box-shadow)' : undefined,
            }}
          >
            <CardContent>
              <Typography variant="h6" sx={{ color: darkMode ? 'var(--text-primary)' : undefined, fontWeight: 'bold' }}>{group.name}</Typography>
              <Typography variant="body2" sx={{ color: darkMode ? 'var(--text-secondary)' : 'text.secondary', mt: 1 }}>
                Created by: {group.teacher_name}
              </Typography>
              <Typography variant="body2" sx={{ color: darkMode ? 'var(--text-secondary)' : 'text.secondary' }}>
                Members: {group.member_count}
              </Typography>
              {user.profile?.role === 'teacher' && group.teacher === user.id && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, color: darkMode ? 'var(--text-primary)' : undefined, fontWeight: 'bold' }}>
                    Group Members
                  </Typography>
                  {renderGroupMembersTable(group.id)}
                  <Typography variant="subtitle2" sx={{ mb: 1, mt: 2, color: darkMode ? 'var(--text-primary)' : undefined, fontWeight: 'bold' }}>
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
                    sx={{ 
                      mt: 2,
                      borderColor: darkMode ? 'var(--danger)' : undefined,
                      color: darkMode ? 'var(--danger)' : undefined,
                      '&:hover': {
                        backgroundColor: darkMode ? 'rgba(217, 4, 41, 0.1)' : undefined,
                        borderColor: darkMode ? 'var(--danger)' : undefined,
                      }
                    }}
                  >
                    Delete Group
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        ))}
      </List>

      {user.profile?.role === 'student' && (
        <>
          <Typography variant="h5" gutterBottom sx={{ mt: 4, color: darkMode ? 'var(--text-primary)' : undefined }}>
            Available Groups
          </Typography>
          <List>
            {groups
              .filter((group) => !myGroups.some((myGroup) => myGroup.id === group.id))
              .map((group) => (
                <Card 
                  key={group.id} 
                  sx={{ 
                    mb: 2,
                    backgroundColor: darkMode ? 'var(--bg-white)' : undefined,
                    color: darkMode ? 'var(--text-primary)' : undefined,
                    border: darkMode ? '1px solid var(--border-color)' : undefined,
                    boxShadow: darkMode ? 'var(--box-shadow)' : undefined,
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <Typography variant="h6" sx={{ color: darkMode ? 'var(--text-primary)' : undefined, fontWeight: 'bold' }}>{group.name}</Typography>
                        <Typography variant="body2" sx={{ color: darkMode ? 'var(--text-secondary)' : 'text.secondary', mt: 1 }}>
                          Created by: {group.teacher_name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: darkMode ? 'var(--text-secondary)' : 'text.secondary' }}>
                          Members: {group.member_count}
                        </Typography>
                      </div>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {myPendingRequests.includes(group.id) ? (
                          <Chip
                            icon={<PendingIcon />}
                            label="Request Pending"
                            color="warning"
                            variant="outlined"
                            sx={{
                              borderColor: darkMode ? 'var(--warning)' : undefined,
                              color: darkMode ? 'var(--warning)' : undefined,
                              '& .MuiChip-icon': {
                                color: darkMode ? 'var(--warning)' : undefined
                              }
                            }}
                          />
                        ) : (
                          <Button
                            variant="outlined"
                            startIcon={<PersonAddIcon />}
                            onClick={() => handleJoinRequest(group.id)}
                            sx={{
                              borderColor: darkMode ? 'var(--primary)' : undefined,
                              color: darkMode ? 'var(--primary)' : undefined,
                              '&:hover': {
                                backgroundColor: darkMode ? 'rgba(67, 97, 238, 0.1)' : undefined,
                                borderColor: darkMode ? 'var(--primary)' : undefined,
                              }
                            }}
                          >
                            Request to Join
                          </Button>
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
          </List>
        </>
      )}

      <Dialog 
        open={openCreateDialog} 
        onClose={() => setOpenCreateDialog(false)} 
        PaperProps={{
          sx: {
            backgroundColor: darkMode ? 'var(--bg-white)' : undefined,
            color: darkMode ? 'var(--text-primary)' : undefined,
            border: darkMode ? '1px solid var(--border-color)' : undefined,
            boxShadow: darkMode ? 'var(--box-shadow)' : undefined,
          }
        }}
      >
        <DialogTitle sx={{ color: darkMode ? 'var(--text-primary)' : undefined, fontWeight: 'bold', borderBottom: darkMode ? '1px solid var(--border-color)' : undefined, paddingBottom: 2 }}>Create New Group</DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <TextField
            autoFocus
            margin="dense"
            label="Group Name"
            fullWidth
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            sx={{
              '& .MuiInputLabel-root': {
                color: darkMode ? 'var(--text-secondary)' : undefined
              },
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: darkMode ? 'var(--border-color)' : undefined
                },
                '&:hover fieldset': {
                  borderColor: darkMode ? 'var(--primary)' : undefined
                },
                '&.Mui-focused fieldset': {
                  borderColor: darkMode ? 'var(--primary)' : undefined
                },
                color: darkMode ? 'var(--text-primary)' : undefined,
                backgroundColor: darkMode ? 'var(--bg-main)' : undefined
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ padding: 2, borderTop: darkMode ? '1px solid var(--border-color)' : undefined }}>
          <Button 
            onClick={() => setOpenCreateDialog(false)}
            sx={{
              color: darkMode ? 'var(--text-secondary)' : undefined,
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCreateGroup} 
            variant="contained"
            sx={{
              backgroundColor: darkMode ? 'var(--primary)' : undefined,
              '&:hover': {
                backgroundColor: darkMode ? 'var(--primary-dark)' : undefined,
              }
            }}
          >
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
        PaperProps={{
          sx: {
            backgroundColor: darkMode ? 'var(--bg-white)' : undefined,
            color: darkMode ? 'var(--text-primary)' : undefined,
            border: darkMode ? '1px solid var(--border-color)' : undefined,
            boxShadow: darkMode ? 'var(--box-shadow)' : undefined,
          }
        }}
      >
        <DialogTitle sx={{ color: darkMode ? 'var(--text-primary)' : undefined, fontWeight: 'bold', borderBottom: darkMode ? '1px solid var(--border-color)' : undefined, paddingBottom: 2 }}>Delete Group</DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <DialogContentText sx={{ color: darkMode ? 'var(--text-secondary)' : undefined }}>
            Are you sure you want to delete this group? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ padding: 2, borderTop: darkMode ? '1px solid var(--border-color)' : undefined }}>
          <Button
            onClick={() => {
              setOpenDeleteDialog(false);
              setGroupToDelete(null);
            }}
            sx={{
              color: darkMode ? 'var(--text-secondary)' : undefined,
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => handleDeleteGroup(groupToDelete)}
            color="error"
            variant="contained"
            autoFocus
            sx={{
              backgroundColor: darkMode ? 'var(--danger)' : undefined,
              '&:hover': {
                backgroundColor: darkMode ? '#b60321' : undefined,
              }
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Groups; 