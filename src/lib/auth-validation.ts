/**
 * Input length validation and character normalization rules for authentication forms.
 */

export interface AuthValidationResult {
  isValid: boolean;
  error?: string;
  normalizedValue?: string;
}

/**
 * Validates and normalizes First Name.
 * Constraints: Min 2, Max 50 characters. Trims & collapses consecutive spaces.
 */
export function validateFirstName(name: string): AuthValidationResult {
  const trimmed = name.trim().replace(/\s+/g, ' ');
  if (!trimmed) {
    return { isValid: false, error: 'Please complete all required fields.' };
  }
  if (trimmed.length < 2 || trimmed.length > 50) {
    return { isValid: false, error: 'First name must be between 2 and 50 characters.' };
  }
  const nameRegex = /^[a-zA-Z\u00C0-\u024F\s'-]+$/;
  if (!nameRegex.test(trimmed)) {
    return { isValid: false, error: 'First name contains invalid characters.' };
  }
  return { isValid: true, normalizedValue: trimmed };
}

/**
 * Validates and normalizes Last Name.
 * Constraints: Min 1, Max 50 characters. Trims & collapses consecutive spaces.
 */
export function validateLastName(name: string): AuthValidationResult {
  const trimmed = name.trim().replace(/\s+/g, ' ');
  if (!trimmed) {
    return { isValid: false, error: 'Please complete all required fields.' };
  }
  if (trimmed.length < 1 || trimmed.length > 50) {
    return { isValid: false, error: 'Last name must be between 1 and 50 characters.' };
  }
  const nameRegex = /^[a-zA-Z\u00C0-\u024F\s'-]+$/;
  if (!nameRegex.test(trimmed)) {
    return { isValid: false, error: 'Last name contains invalid characters.' };
  }
  return { isValid: true, normalizedValue: trimmed };
}

/**
 * Validates Email address.
 * Constraints: Max 254 characters.
 */
export function validateEmailInput(email: string, isSignIn = false): AuthValidationResult {
  const trimmed = email.trim();
  if (!trimmed) {
    return {
      isValid: false,
      error: isSignIn ? 'The email or password you entered is incorrect.' : 'Please complete all required fields.',
    };
  }
  if (trimmed.length > 254) {
    return {
      isValid: false,
      error: isSignIn ? 'The email or password you entered is incorrect.' : 'Please enter a valid email address.',
    };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return {
      isValid: false,
      error: isSignIn ? 'The email or password you entered is incorrect.' : 'Please enter a valid email address.',
    };
  }
  return { isValid: true, normalizedValue: trimmed };
}

/**
 * Validates Password length.
 * Constraints: Min 8, Max 128 characters.
 */
export function validatePasswordInput(password: string, isSignIn = false): AuthValidationResult {
  if (!password) {
    return {
      isValid: false,
      error: isSignIn ? 'The email or password you entered is incorrect.' : 'Please complete all required fields.',
    };
  }
  if (password.length < 8 || password.length > 128) {
    return {
      isValid: false,
      error: isSignIn
        ? 'The email or password you entered is incorrect.'
        : 'Your password does not meet the minimum requirements.',
    };
  }
  return { isValid: true };
}
