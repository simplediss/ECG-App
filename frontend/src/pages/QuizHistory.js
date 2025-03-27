import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchQuizHistory } from '../api/quizApi';
import '../styles/QuizHistory.css';

const QuizHistory = () => {
  const navigate = useNavigate();
  const [quizHistory, setQuizHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadQuizHistory();
  }, []);

  const loadQuizHistory = async () => {
    try {
      setIsLoading(true);
      const data = await fetchQuizHistory();
      // Sort quiz attempts by completed_at date in descending order (newest to oldest)
      const sortedData = [...data].sort((a, b) => {
        const dateA = a.completed_at ? new Date(a.completed_at) : new Date(0);
        const dateB = b.completed_at ? new Date(b.completed_at) : new Date(0);
        return dateB - dateA;
      });
      setQuizHistory(sortedData);
      setIsLoading(false);
    } catch (err) {
      setError('Failed to load quiz history. Please try again later.');
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatScore = (score) => {
    if (typeof score !== 'number' || isNaN(score)) {
      return '0%';
    }
    return `${Math.round(score)}%`;
  };

  const calculateAccuracy = (correct, total) => {
    if (!correct || !total || total === 0) {
      return '0%';
    }
    return `${((correct / total) * 100).toFixed(1)}%`;
  };

  if (isLoading) {
    return <div className="quiz-history-container">Loading quiz history...</div>;
  }

  if (error) {
    return <div className="quiz-history-container error">{error}</div>;
  }

  return (
    <div className="quiz-history-container">
      <div className="quiz-history-header">
        <h1 className="quiz-history-title">Quiz History</h1>
      </div>

      {quizHistory.length === 0 ? (
        <div className="no-history">
          <p>You haven't taken any quizzes yet.</p>
          <button onClick={() => navigate('/quiz')} className="primary-button">
            Take a Quiz
          </button>
        </div>
      ) : (
        <div className="quiz-history-table">
          <table>
            <thead>
              <tr>
                <th>Quiz</th>
                <th>Date</th>
                <th>Score</th>
                <th>Correct</th>
                <th>Total</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {quizHistory.map((attempt) => (
                <tr key={attempt.id}>
                  <td>{attempt.quiz?.title || 'Untitled Quiz'}</td>
                  <td>{attempt.completed_at ? formatDate(attempt.completed_at) : 'In Progress'}</td>
                  <td>{formatScore(attempt.score)}</td>
                  <td>{attempt.correct_answers || 0}</td>
                  <td>{attempt.total_questions || 0}</td>
                  <td>
                    <button
                      onClick={() => navigate('/quiz', { state: { retakeQuizId: attempt.quiz?.id } })}
                      className="retake-button"
                    >
                      Retake
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default QuizHistory; 