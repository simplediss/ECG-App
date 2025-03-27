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

// Check individual answer
export const checkAnswer = async (questionId, choiceId) => {
  try {
    const response = await axiosInstance.post('check-answer/', {
      question_id: questionId,
      choice_id: choiceId
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Generate a random quiz
export const generateRandomQuiz = async () => {
  try {
    const response = await axiosInstance.post('quizzes/generate_random/');
    return response.data;
  } catch (error) {
    throw error;
  }
}; 