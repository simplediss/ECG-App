import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { generateRandomQuiz, submitQuizAnswers, checkAnswer, fetchQuizQuestions } from '../api/quizApi';
import { getImageUrl } from '../api/axiosInstance';
import '../styles/Quiz.css';

const Quiz = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [score, setScore] = useState(null);
  const [quizResult, setQuizResult] = useState(null);
  const [randomizedChoices, setRandomizedChoices] = useState([]);
  const [currentAnswer, setCurrentAnswer] = useState(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [correctChoiceId, setCorrectChoiceId] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [duration, setDuration] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState('');

  // Function to shuffle array
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  useEffect(() => {
    loadQuizzes();
  }, []);

  // Effect to handle retake quiz from navigation state
  useEffect(() => {
    if (quizzes.length > 0 && location.state?.retakeQuizId) {
      const quizToRetake = quizzes.find(quiz => quiz.id === location.state.retakeQuizId);
      if (quizToRetake) {
        handleQuizSelect(quizToRetake);
      }
    }
  }, [quizzes, location.state]);

  // Effect to randomize choices when question changes
  useEffect(() => {
    if (selectedQuiz && selectedQuiz.questions[currentQuestionIndex]) {
      const currentQuestion = selectedQuiz.questions[currentQuestionIndex];
      setRandomizedChoices(shuffleArray(currentQuestion.choices));
    }
  }, [selectedQuiz, currentQuestionIndex]);

  const loadQuizzes = async () => {
    try {
      setIsLoading(true);
      const data = await fetchQuizQuestions();
      setQuizzes(data);
      setIsLoading(false);
    } catch (err) {
      setError('Failed to load quizzes. Please try again later.');
      setIsLoading(false);
    }
  };

  const startNewQuiz = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const quiz = await generateRandomQuiz();
      setSelectedQuiz(quiz);
      setCurrentQuestionIndex(0);
      setAnswers({});
      setQuizSubmitted(false);
      setScore(null);
      setQuizResult(null);
      setCurrentAnswer(null);
      setIsAnswerChecked(false);
      setCorrectChoiceId(null);
      setStartTime(Date.now());
      setDuration(null);
      if (quiz.questions[0]) {
        setRandomizedChoices(shuffleArray(quiz.questions[0].choices));
      }
    } catch (err) {
      setError('Failed to generate quiz. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuizSelect = (quiz) => {
    setSelectedQuiz(quiz);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setQuizSubmitted(false);
    setScore(null);
    setQuizResult(null);
    setCurrentAnswer(null);
    setIsAnswerChecked(false);
    setCorrectChoiceId(null);
    setStartTime(Date.now());
    setDuration(null);
    if (quiz.questions[0]) {
      setRandomizedChoices(shuffleArray(quiz.questions[0].choices));
    }
  };

  const handleAnswerSelect = (questionId, selectedChoice) => {
    if (isAnswerChecked) return; // Prevent changing answer after checking
    setCurrentAnswer(selectedChoice);
    setAnswers(prev => ({
      ...prev,
      [questionId]: selectedChoice
    }));
  };

  const handleCheckAnswer = async () => {
    if (!currentAnswer) return;
    
    try {
      const currentQuestion = selectedQuiz.questions[currentQuestionIndex];
      const result = await checkAnswer(currentQuestion.id, currentAnswer);
      setIsAnswerChecked(true);
      setCorrectChoiceId(result.correct_choice_id);
    } catch (err) {
      setError('Failed to check answer. Please try again.');
    }
  };

  const handleNext = () => {
    if (!isAnswerChecked) return;
    
    if (currentQuestionIndex < selectedQuiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setCurrentAnswer(null);
      setIsAnswerChecked(false);
      setCorrectChoiceId(null);
    } else {
      // This is the last question, submit the quiz
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    try {
      const finalAnswers = {
        ...answers,
        [selectedQuiz.questions[currentQuestionIndex].id]: currentAnswer
      };

      const result = await submitQuizAnswers({
        quiz: selectedQuiz.id,
        answers: Object.entries(finalAnswers).map(([questionId, choiceId]) => ({
          question: parseInt(questionId),
          selected_choice: choiceId
        }))
      });
      
      // Calculate duration
      const endTime = Date.now();
      const quizDuration = Math.floor((endTime - startTime) / 1000); // Convert to seconds
      setDuration(quizDuration);
      
      setScore(result.score);
      setQuizResult(result);
      setQuizSubmitted(true);
    } catch (err) {
      setError('Failed to submit quiz. Please try again.');
    }
  };

  // Helper function to get the question text, handling different API response formats
  const getQuestionText = (question) => {
    return question.text || question.question_text;
  };

  // Helper function to get the image URL for an ECG sample
  const getEcgImageUrl = (question) => {
    if (question.image_url) {
      return question.image_url;
    } else if (question.ecg_sample && question.ecg_sample.sample_path) {
      return getImageUrl(question.ecg_sample.sample_path + '.png');
    }
    return null;
  };

  // Function to open the image modal
  const openImageModal = (imageUrl) => {
    setModalImageUrl(imageUrl);
    setShowImageModal(true);
  };

  // Function to close the image modal
  const closeImageModal = () => {
    setShowImageModal(false);
    setModalImageUrl('');
  };

  if (isLoading) {
    return <div className="quiz-container">Generating quiz...</div>;
  }

  if (error) {
    return (
      <div className="quiz-container">
        <div className="error-message">{error}</div>
        <button onClick={startNewQuiz} className="primary-button">
          Try Again
        </button>
      </div>
    );
  }

  if (!selectedQuiz) {
    return (
      <div className="quiz-container">
        <div className="quiz-header">
          <h2>ECG Quiz</h2>
          <button onClick={() => navigate('/home')} className="back-button">
            Back to Home
          </button>
        </div>
        <div className="quiz-start">
          <p>Test your ECG interpretation skills with a randomly generated quiz.</p>
          <button onClick={startNewQuiz} className="primary-button">
            Start Quiz
          </button>
        </div>
      </div>
    );
  }

  if (quizSubmitted) {
    // Format duration into minutes and seconds
    const formatDuration = (seconds) => {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds}s`;
    };

    return (
      <div className="quiz-container">
        <div className="quiz-summary">
          <h2>Quiz Summary</h2>
          <div className="summary-stats">
            <div className="stat-card">
              <h3>Overall Score</h3>
              <div className="score-circle">
                <span className="score-value">{Math.round(score)}%</span>
              </div>
            </div>
            <div className="stat-card">
              <h3>Performance</h3>
              <div className="performance-stats">
                <p>Correct Answers: {quizResult?.correct_answers || 0}</p>
                <p>Total Questions: {quizResult?.total_questions || 0}</p>
                <p>Time Taken: {formatDuration(duration)}</p>
                <p>Accuracy: {quizResult ? ((quizResult.correct_answers / quizResult.total_questions) * 100).toFixed(1) : 0}%</p>
              </div>
            </div>
          </div>
          <div className="quiz-actions">
            <button onClick={() => navigate('/home')} className="primary-button">
              Back to Home
            </button>
            <button onClick={startNewQuiz} className="secondary-button">
              Take Another Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  const renderOptions = () => {
    return randomizedChoices.map((choice) => {
      let optionClass = '';
      
      if (isAnswerChecked) {
        if (choice.id === correctChoiceId) {
          optionClass = 'correct';
        } else if (choice.id === currentAnswer) {
          optionClass = choice.id === correctChoiceId ? 'correct' : 'incorrect';
        }
      } else if (choice.id === currentAnswer) {
        optionClass = 'selected';
      }
      
      return (
        <button
          key={choice.id}
          onClick={() => handleAnswerSelect(selectedQuiz.questions[currentQuestionIndex].id, choice.id)}
          className={`option-button ${optionClass}`}
          disabled={isAnswerChecked}
        >
          <div className="option-label">
            <span className="option-marker">{String.fromCharCode(65 + randomizedChoices.indexOf(choice))}</span>
            {choice.text}
          </div>
        </button>
      );
    });
  };

  return (
    <div className="quiz-container">
      {showImageModal && (
        <div className="image-modal" onClick={closeImageModal}>
          <div className="modal-content">
            <span className="close-modal" onClick={closeImageModal}>&times;</span>
            <img 
              src={modalImageUrl} 
              alt="ECG Sample (Full Size)" 
              className="modal-image"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/placeholder-ecg.svg';
              }}
            />
          </div>
        </div>
      )}

      <div className="quiz-header">
        <h2>ECG Quiz</h2>
        <button onClick={() => navigate('/home')} className="back-button">
          Back to Home
        </button>
      </div>
      
      <div className="quiz-progress">
        <span>Question {currentQuestionIndex + 1} of {selectedQuiz.questions.length}</span>
        <span>{isAnswerChecked ? 'Answered' : 'Select an answer'}</span>
      </div>
      
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${((currentQuestionIndex + (isAnswerChecked ? 1 : 0)) / selectedQuiz.questions.length) * 100}%` }} 
        ></div>
      </div>
      
      {(() => {
        const currentQuestion = selectedQuiz.questions[currentQuestionIndex];
        const imageUrl = getEcgImageUrl(currentQuestion);
        return imageUrl ? (
          <div className="ecg-image-container">
            <img 
              src={imageUrl}
              alt="ECG Sample" 
              className="ecg-image"
              onClick={() => openImageModal(imageUrl)}
              onError={(e) => {
                e.target.onerror = null; // Prevent infinite loop
                e.target.src = '/placeholder-ecg.svg'; // Fallback to SVG
              }}
            />
          </div>
        ) : null;
      })()}
      
      <div className="question-container">
        <h3>{getQuestionText(selectedQuiz.questions[currentQuestionIndex])}</h3>
        <div className="options-container">
          {renderOptions()}
        </div>
      </div>
      
      <div className="question-actions">
        {!isAnswerChecked ? (
          <button 
            className="check-button" 
            onClick={handleCheckAnswer}
            disabled={!currentAnswer}
          >
            Check Answer
          </button>
        ) : (
          <button 
            className="next-button" 
            onClick={handleNext}
          >
            {currentQuestionIndex < selectedQuiz.questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
          </button>
        )}
      </div>
    </div>
  );
};

export default Quiz; 