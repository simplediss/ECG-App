import axiosInstance from './axiosInstance';

// Get all groups
export const fetchGroups = async () => {
  try {
    const response = await axiosInstance.get('/groups/');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get user's groups
export const fetchMyGroups = async () => {
  try {
    const response = await axiosInstance.get('/groups/my_groups/');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get pending group requests
export const fetchPendingRequests = async () => {
  try {
    const response = await axiosInstance.get('/group-requests/');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get group members
export const fetchGroupMembers = async (groupId) => {
  try {
    const response = await axiosInstance.get(`/groups/${groupId}/`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Create a new group
export const createGroup = async (groupName) => {
  try {
    const response = await axiosInstance.post('/groups/', { name: groupName });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Delete a group
export const deleteGroup = async (groupId) => {
  try {
    const response = await axiosInstance.delete(`/groups/${groupId}/`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Send a join request to a group
export const sendJoinRequest = async (groupId) => {
  try {
    const response = await axiosInstance.post(`/groups/${groupId}/join_request/`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Approve a join request
export const approveRequest = async (groupId, requestId) => {
  try {
    const response = await axiosInstance.post(`/groups/${groupId}/approve_request/`, { request_id: requestId });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Reject a join request
export const rejectRequest = async (groupId, requestId) => {
  try {
    const response = await axiosInstance.post(`/groups/${groupId}/reject_request/`, { request_id: requestId });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Remove a user from a group
export const removeUserFromGroup = async (groupId, userId) => {
  try {
    const response = await axiosInstance.post(`/groups/${groupId}/remove_user/`, { user_id: userId });
    return response.data;
  } catch (error) {
    throw error;
  }
}; 