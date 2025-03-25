import axiosInstance from './axiosInstance';

// Get quiz questions
export const fetchQuizQuestions = async () => {
  try {
    const response = await axiosInstance.get('quizzes/');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Submit quiz answers
export const submitQuizAnswers = async (answers) => {
  try {
    const response = await axiosInstance.post('quiz-attempts/', answers);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get user's quiz history
export const fetchQuizHistory = async () => {
  try {
    const response = await axiosInstance.get('quiz-attempts/');
    return response.data;
  } catch (error) {
    throw error;
  }
}; 