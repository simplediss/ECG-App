import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import '../styles/pages/Login.css';
import FormProgressIndicator from '../components/forms/FormProgressIndicator';
import FormField from '../components/forms/FormField';
import FormStep from '../components/forms/FormStep';
import { validateAccountStep, validatePersonalInfoStep, isStepValid } from '../components/forms/FormValidation';

const Register = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const steps = [
    { label: 'Account' },
    { label: 'Personal Info' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleNext = (e) => {
    e.preventDefault();
    const stepErrors = currentStep === 1 
      ? validateAccountStep(formData)
      : validatePersonalInfoStep(formData);
    
    setErrors(stepErrors);
    
    if (isStepValid(stepErrors)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = (e) => {
    e.preventDefault();
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const stepErrors = validatePersonalInfoStep(formData);
    setErrors(stepErrors);
    
    if (!isStepValid(stepErrors)) return;
    
    setIsLoading(true);
    try {
      const response = await axiosInstance.post('/api/auth/register/', formData);
      if (response.data) {
        navigate('/login', { state: { message: 'Registration successful! Please log in.' } });
      }
    } catch (error) {
      const serverErrors = error.response?.data || {};
      const fieldErrors = {};
      
      // Handle field-specific errors
      Object.keys(serverErrors).forEach(key => {
        if (Array.isArray(serverErrors[key])) {
          fieldErrors[key] = serverErrors[key][0];
        } else if (typeof serverErrors[key] === 'string') {
          fieldErrors[key] = serverErrors[key];
        }
      });
      
      // Handle general error message
      if (serverErrors.message && !fieldErrors.general) {
        fieldErrors.general = serverErrors.message;
      }
      
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors);
        if (fieldErrors.username || fieldErrors.email || fieldErrors.password || fieldErrors.confirmPassword) {
          setCurrentStep(1);
        }
      } else if (typeof serverErrors === 'string') {
        setErrors({ general: serverErrors });
      } else {
        setErrors({ general: 'Registration failed. Please try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <div className="logo-container">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" className="logo-icon activity-icon" viewBox="0 0 16 16">
                <path fillRule="evenodd" d="M6 2a.5.5 0 0 1 .47.33L10 12.036l1.53-4.208A.5.5 0 0 1 12 7.5h3.5a.5.5 0 0 1 0 1h-3.15l-1.88 5.17a.5.5 0 0 1-.94 0L6 3.964 4.47 8.171A.5.5 0 0 1 4 8.5H.5a.5.5 0 0 1 0-1h3.15l1.88-5.17A.5.5 0 0 1 6 2"/>
              </svg>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="logo-icon heart-icon" viewBox="0 0 16 16">
                <path fillRule="evenodd" d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314"/>
              </svg>
            </div>
            <h1>ECGenius</h1>
          </div>
          <h2>Create Account</h2>
          <p className="auth-subtitle">Fill in your details to get started</p>
        </div>

        <FormProgressIndicator
          currentStep={currentStep}
          totalSteps={steps.length}
          steps={steps}
        />

        {errors.general && (
          <div className="alert alert-danger" role="alert">
            {errors.general}
          </div>
        )}

        <FormStep
          isActive={currentStep === 1}
          onSubmit={handleSubmit}
          onNext={handleNext}
          onPrev={handlePrev}
          isFirstStep={true}
          isLastStep={false}
          isValid={isStepValid(errors)}
        >
          <FormField
            label="Username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            error={errors.username}
            required
          />
          <FormField
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            required
          />
          <FormField
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            required
          />
          <FormField
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
            required
          />
        </FormStep>

        <FormStep
          isActive={currentStep === 2}
          onSubmit={handleSubmit}
          onNext={handleNext}
          onPrev={handlePrev}
          isFirstStep={false}
          isLastStep={true}
          isValid={isStepValid(errors)}
        >
          <div className="form-row">
            <FormField
              label="First Name"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              error={errors.first_name}
              required
            />
            <FormField
              label="Last Name"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              error={errors.last_name}
              required
            />
          </div>
          <FormField
            label="Date of Birth"
            name="date_of_birth"
            type="date"
            value={formData.date_of_birth}
            onChange={handleChange}
            error={errors.date_of_birth}
            required
          />
          <div className="form-group">
            <label htmlFor="gender">
              Gender
              <span style={{ color: '#e74c3c' }}> *</span>
            </label>
            <select
              id="gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className={errors.gender ? 'error' : ''}
              required
            >
              <option value="">Select gender</option>
              <option value="M">Male</option>
              <option value="F">Female</option>
              <option value="O">Other</option>
            </select>
            {errors.gender && <div className="error-message">{errors.gender}</div>}
          </div>
        </FormStep>

        <div className="auth-footer">
          <p>
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register; 