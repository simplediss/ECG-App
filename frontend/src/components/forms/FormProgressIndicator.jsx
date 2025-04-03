import React from 'react';
import PropTypes from 'prop-types';

const FormProgressIndicator = ({ currentStep, totalSteps, steps }) => {
  const progressContainerStyle = {
    width: '100%',
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    position: 'relative'
  };

  const progressBarStyle = {
    position: 'absolute',
    height: '4px',
    backgroundColor: '#4caf50',
    top: '50%',
    left: '0',
    transform: 'translateY(-50%)',
    width: `${(currentStep / totalSteps) * 100}%`,
    transition: 'width 0.3s ease'
  };

  const progressStepStyle = (stepNum) => ({
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    backgroundColor: currentStep >= stepNum ? '#4caf50' : '#e0e0e0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: 'bold',
    zIndex: 1,
    transition: 'background-color 0.3s ease'
  });

  const progressLabelStyle = {
    textAlign: 'center',
    fontSize: '12px',
    marginTop: '5px'
  };

  return (
    <div style={progressContainerStyle}>
      <div style={progressBarStyle}></div>
      {steps.map((step, index) => (
        <div key={index} style={{ textAlign: 'center', zIndex: 2 }}>
          <div style={progressStepStyle(index + 1)}>{index + 1}</div>
          <div style={progressLabelStyle}>{step.label}</div>
        </div>
      ))}
    </div>
  );
};

FormProgressIndicator.propTypes = {
  currentStep: PropTypes.number.isRequired,
  totalSteps: PropTypes.number.isRequired,
  steps: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired
    })
  ).isRequired
};

export default FormProgressIndicator; 