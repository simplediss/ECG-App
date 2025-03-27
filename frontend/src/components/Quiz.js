import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { generateRandomQuiz, submitQuizAnswers, checkAnswer, fetchQuizQuestions } from '../api/quizApi';
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

  const renderQuestion = () => {
    const currentQuestion = selectedQuiz.questions[currentQuestionIndex];
    const imagePath = currentQuestion.ecg_sample?.sample_path;
    const imageUrl = imagePath ? `${process.env.REACT_APP_API_BASE_URL}/images/${encodeURIComponent(imagePath + '.png')}` : null;

    return (
      <div className="question-container">
        <h3>{currentQuestion.question_text}</h3>
        
        {imageUrl && (
          <div className="ecg-image-container">
            <img 
              src={imageUrl} 
              alt="ECG Sample" 
              className="ecg-image"
              onError={(e) => {
                e.target.onerror = null; // Prevent infinite loop
                e.target.src = '/placeholder-ecg.png'; // Fallback image
              }}
            />
          </div>
        )}
        
        <div className="options-container">
          {randomizedChoices.map((choice) => (
            <button
              key={choice.id}
              className={`option-button ${
                currentAnswer === choice.id ? 'selected' : ''
              } ${
                isAnswerChecked
                  ? choice.id === correctChoiceId
                    ? 'correct'
                    : currentAnswer === choice.id && choice.id !== correctChoiceId
                    ? 'incorrect'
                    : ''
                  : ''
              }`}
              onClick={() => handleAnswerSelect(currentQuestion.id, choice.id)}
              disabled={isAnswerChecked}
            >
              {choice.text}
            </button>
          ))}
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
              {currentQuestionIndex === selectedQuiz.questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="quiz-container">
      <div className="quiz-header">
        <button onClick={() => setSelectedQuiz(null)} className="back-button">
          Back to Quiz Menu
        </button>
        <h2>{selectedQuiz.title}</h2>
      </div>

      <div className="quiz-progress">
        Question {currentQuestionIndex + 1} of {selectedQuiz.questions.length}
      </div>
      
      {renderQuestion()}
    </div>
  );
};

export default Quiz; 