// Validation rules for different field types
export const validateEmail = (email) => {
  if (!email) return 'Email is required';
  if (!/\S+@\S+\.\S+/.test(email)) return 'Email is invalid';
  return '';
};

export const validatePassword = (password) => {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  return '';
};

export const validateConfirmPassword = (password, confirmPassword) => {
  if (!confirmPassword) return 'Please confirm your password';
  if (password !== confirmPassword) return 'Passwords do not match';
  return '';
};

export const validateRequired = (value, fieldName) => {
  if (!value || !value.trim()) return `${fieldName} is required`;
  return '';
};

export const validateUsername = (username) => {
  if (!username) return 'Username is required';
  if (username.length < 3) return 'Username must be at least 3 characters';
  return '';
};

// Form step validation
export const validateAccountStep = (formData) => {
  const errors = {};
  
  const usernameError = validateUsername(formData.username);
  if (usernameError) errors.username = usernameError;
  
  const emailError = validateEmail(formData.email);
  if (emailError) errors.email = emailError;
  
  const passwordError = validatePassword(formData.password);
  if (passwordError) errors.password = passwordError;
  
  const confirmPasswordError = validateConfirmPassword(formData.password, formData.confirmPassword);
  if (confirmPasswordError) errors.confirmPassword = confirmPasswordError;
  
  return errors;
};

export const validatePersonalInfoStep = (formData) => {
  const errors = {};
  
  const firstNameError = validateRequired(formData.first_name, 'First name');
  if (firstNameError) errors.first_name = firstNameError;
  
  const lastNameError = validateRequired(formData.last_name, 'Last name');
  if (lastNameError) errors.last_name = lastNameError;
  
  const dobError = validateRequired(formData.date_of_birth, 'Date of birth');
  if (dobError) errors.date_of_birth = dobError;
  
  const genderError = validateRequired(formData.gender, 'Gender');
  if (genderError) errors.gender = genderError;
  
  return errors;
};

// Helper function to check if a form step is valid
export const isStepValid = (errors) => {
  return Object.keys(errors).length === 0;
}; 