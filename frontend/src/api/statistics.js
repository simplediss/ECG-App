import axios from 'axios';
import axiosInstance from './axiosInstance';

export const getUserStatistics = async (userId, daysLimit = null, quizLimit = null) => {
    try {
        const params = new URLSearchParams();
        if (daysLimit) params.append('days_limit', daysLimit);
        if (quizLimit) params.append('quiz_limit', quizLimit);

        const response = await axiosInstance.get(`/statistics/user/${userId}/?${params.toString()}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching user statistics:', error);
        throw error;
    }
}; 