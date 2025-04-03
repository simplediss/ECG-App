import React from 'react';
import PropTypes from 'prop-types';

const FormStep = ({
  children,
  isActive,
  onSubmit,
  onNext,
  onPrev,
  isFirstStep,
  isLastStep,
  isValid = true
}) => {
  if (!isActive) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isValid) {
      if (isLastStep) {
        onSubmit(e);
      } else {
        onNext(e);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-step">
      {children}
      <div className="form-actions">
        {!isFirstStep && (
          <button
            type="button"
            onClick={onPrev}
            className="btn btn-secondary"
          >
            Previous
          </button>
        )}
        <button
          type="submit"
          className="btn btn-primary"
          disabled={!isValid}
        >
          {isLastStep ? 'Submit' : 'Next'}
        </button>
      </div>
    </form>
  );
};

FormStep.propTypes = {
  children: PropTypes.node.isRequired,
  isActive: PropTypes.bool.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onNext: PropTypes.func.isRequired,
  onPrev: PropTypes.func.isRequired,
  isFirstStep: PropTypes.bool.isRequired,
  isLastStep: PropTypes.bool.isRequired,
  isValid: PropTypes.bool
};

export default FormStep; 