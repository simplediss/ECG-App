import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchQuizQuestions, submitQuizAnswers, checkAnswer } from '../api/quizApi';
import '../styles/Quiz.css';

const Quiz = () => {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isLoading, setIsLoading] = useState(true);
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
    setStartTime(quiz ? Date.now() : null);
    setDuration(null);
    if (quiz) {
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

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
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
    return <div className="quiz-container">Loading quizzes...</div>;
  }

  if (error) {
    return <div className="quiz-container error">{error}</div>;
  }

  if (!selectedQuiz) {
    return (
      <div className="quiz-container">
        <div className="quiz-header">
          <h2>Available Quizzes</h2>
          <button onClick={() => navigate('/home')} className="back-button">
            Back to Home
          </button>
        </div>
        <div className="quiz-list">
          {quizzes.map(quiz => (
            <div key={quiz.id} className="quiz-card" onClick={() => handleQuizSelect(quiz)}>
              <h3>{quiz.title}</h3>
              <p>{quiz.description}</p>
              <span className="quiz-info">Questions: {quiz.questions?.length || 0}</span>
            </div>
          ))}
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
            <button onClick={() => handleQuizSelect(null)} className="secondary-button">
              Back to Quiz List
            </button>
            <button onClick={() => handleQuizSelect(selectedQuiz)} className="secondary-button">
              Retake Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  const renderQuestion = () => {
    const currentQuestion = selectedQuiz.questions[currentQuestionIndex];

    return (
      <div className="question-container">
        <h3>{currentQuestion.question_text}</h3>
        
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
              onClick={handleCheckAnswer}
              disabled={!currentAnswer}
              className="check-button"
            >
              Check Answer
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="next-button"
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
        <button onClick={() => handleQuizSelect(null)} className="back-button">
          Back to Quiz List
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