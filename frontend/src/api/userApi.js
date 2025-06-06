import axiosInstance from './axiosInstance';

// Get all user profiles
export const fetchProfiles = async () => {
  try {
    const response = await axiosInstance.get('profiles/');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Create a new user
export const createUser = async (userData) => {
  try {
    const response = await axiosInstance.post('auth/register/', userData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update a user profile
export const updateUserProfile = async (profileId, userData) => {
  try {
    const response = await axiosInstance.put(`user-profile/${profileId}/`, userData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Delete a user profile
export const deleteUserProfile = async (profileId) => {
  try {
    const response = await axiosInstance.delete(`profiles/${profileId}/`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getStudentDetails = async (username) => {
  const response = await axiosInstance.get(`profiles/by-username/${username}/`);
  return {
    ...response.data.user,
    ...response.data,
    gender: response.data.gender || 'Not specified',
  };
};

// Get quiz attempts for a specific student
export const getStudentQuizAttempts = async (username) => {
  try {
    const response = await axiosInstance.get(`quiz-attempts/by-username/${username}/`);
    return response.data;
  } catch (error) {
    throw error;
  }
}; 