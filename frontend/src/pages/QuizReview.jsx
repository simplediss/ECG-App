import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchQuizAttempt } from '../api/quizApi';
import { useAuth } from '../context/AuthContext';
import { getImageUrl } from '../api/axiosInstance';
import '../styles/pages/QuizReview.css';

const QuizReview = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [quizAttempt, setQuizAttempt] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    loadQuizAttempt();
  }, [attemptId]);

  const loadQuizAttempt = async () => {
    try {
      setIsLoading(true);
      const data = await fetchQuizAttempt(attemptId);
      setQuizAttempt(data);
      setIsLoading(false);
    } catch (err) {
      setError('Failed to load quiz attempt. Please try again later.');
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).replace(/\//g, '/');
  };

  const getCorrectChoice = (choices) => {
    if (!choices || !Array.isArray(choices)) {
      return null;
    }
    return choices.find(choice => choice.is_correct);
  };

  const getEcgImageUrl = (question) => {
    if (!question?.ecg_sample?.sample_path) return null;
    return getImageUrl(question.ecg_sample.sample_path + '.png');
  };

  if (isLoading) {
    return <div className="quiz-review-container">Loading quiz review...</div>;
  }

  if (error) {
    return <div className="quiz-review-container error">{error}</div>;
  }

  if (!quizAttempt) {
    return <div className="quiz-review-container">Quiz attempt not found.</div>;
  }

  return (
    <div className="quiz-review-container">
      <div className="quiz-review-header">
        <h1>Quiz Review</h1>
      </div>

      <div className="quiz-review-summary">
        <div className="summary-card">
          <h3>Student</h3>
          <p>{quizAttempt.user?.first_name && quizAttempt.user?.last_name ? `${quizAttempt.user.first_name} ${quizAttempt.user.last_name}` : quizAttempt.user?.username || 'Unknown Student'}</p>
        </div>
        <div className="summary-card">
          <h3>Date</h3>
          <p>{formatDate(quizAttempt.completed_at)}</p>
        </div>
        <div className="summary-card">
          <h3>Score</h3>
          <p className={`score ${quizAttempt.score >= 70 ? 'good' : quizAttempt.score >= 50 ? 'average' : 'poor'}`}>
            {Math.round(quizAttempt.score)}
          </p>
        </div>
      </div>

      <div className="quiz-questions">
        <h2>Questions and Answers</h2>
        {quizAttempt.question_attempts?.map((attempt, index) => {
          const correctChoice = getCorrectChoice(attempt.question?.choices);
          const imageUrl = getEcgImageUrl(attempt.question);
          
          return (
            <div key={attempt.id} className="question-card">
              <div className="question-header">
                <h3>Question {index + 1}</h3>
                <span className={`answer-status ${attempt.is_correct ? 'correct' : 'incorrect'}`}>
                  {attempt.is_correct ? 'Correct' : 'Incorrect'}
                </span>
              </div>
              <p className="question-text">{attempt.question?.question_text}</p>
              
              {imageUrl && (
                <div className="ecg-image-container">
                  <img 
                    src={imageUrl}
                    alt="ECG Sample"
                    className="ecg-image"
                    onClick={() => setSelectedImage(imageUrl)}
                  />
                </div>
              )}
              
              <div className="choices">
                {attempt.question?.choices?.map((choice) => (
                  <div
                    key={choice.id}
                    className={`choice ${
                      choice.id === attempt.selected_choice?.id
                        ? 'selected'
                        : choice.is_correct
                        ? 'correct'
                        : ''
                    }`}
                  >
                    <span className="choice-text">{choice.text}</span>
                    {choice.id === attempt.selected_choice?.id && (
                      <span className="choice-label">Student's Answer</span>
                    )}
                    {choice.is_correct && (
                      <span className="choice-label">Correct Answer</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {selectedImage && (
        <div className="image-modal" onClick={() => setSelectedImage(null)}>
          <div className="modal-content">
            <img src={selectedImage} alt="ECG Sample (Large)" />
            <button className="close-modal" onClick={() => setSelectedImage(null)}>×</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizReview; 