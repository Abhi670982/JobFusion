/**
 * Utility for mapping authentication failures to friendly, secure user-facing messages.
 */

function isNetworkError(err: any): boolean {
  if (!err) return false;
  if (typeof navigator !== 'undefined' && !navigator.onLine) return true;
  const msg = (err.message || String(err)).toLowerCase();
  return (
    err.name === 'TypeError' ||
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('network error') ||
    msg.includes('connection refused') ||
    msg.includes('unable to connect')
  );
}

/**
 * Maps login authentication failures to friendly, secure user-facing messages.
 * Never leaks whether an email address exists in the database.
 */
export function mapSignInError(err: any): string {
  if (isNetworkError(err)) {
    return 'Unable to connect. Please check your internet connection and try again.';
  }

  const clerkErrors = err?.errors || (Array.isArray(err) ? err : null);
  const rawCode = clerkErrors?.[0]?.code || '';
  const rawMsg = (clerkErrors?.[0]?.message || err?.message || String(err)).toLowerCase();

  // Known authentication credential failure patterns (Clerk codes & messages)
  const isCredentialFailure =
    rawCode.includes('form_identifier_not_found') ||
    rawCode.includes('form_password_incorrect') ||
    rawCode.includes('form_param_format_invalid') ||
    rawCode.includes('form_identifier_invalid') ||
    rawMsg.includes('identifier') ||
    rawMsg.includes('password') ||
    rawMsg.includes('incorrect') ||
    rawMsg.includes('invalid') ||
    rawMsg.includes('not found') ||
    rawMsg.includes('user does not exist') ||
    rawMsg.includes('no user');

  if (isCredentialFailure) {
    return 'The email or password you entered is incorrect.';
  }

  if (rawCode.includes('too_many_requests') || rawMsg.includes('too many') || rawMsg.includes('rate limit')) {
    return 'Too many sign in attempts. Please wait a moment and try again.';
  }

  return 'Something went wrong. Please try again later.';
}

/**
 * Maps signup registration failures to friendly user-facing messages.
 */
export function mapSignUpError(err: any): string {
  if (isNetworkError(err)) {
    return 'Unable to connect. Please check your internet connection and try again.';
  }

  const clerkErrors = err?.errors || (Array.isArray(err) ? err : null);
  const rawCode = clerkErrors?.[0]?.code || '';
  const rawMsg = (clerkErrors?.[0]?.message || err?.message || String(err)).toLowerCase();

  // 1. Existing email / duplicate account
  if (
    rawCode.includes('form_identifier_exists') ||
    rawCode.includes('form_email_exists') ||
    rawMsg.includes('already exists') ||
    rawMsg.includes('already taken') ||
    rawMsg.includes('registered') ||
    rawMsg.includes('in use')
  ) {
    return 'An account with this email already exists. Please sign in instead.';
  }

  // 2. Weak password / password requirements
  if (
    rawCode.includes('form_password') ||
    rawCode.includes('password_pwned') ||
    rawCode.includes('password_length') ||
    rawMsg.includes('password')
  ) {
    return 'Your password does not meet the minimum requirements.';
  }

  // 3. Invalid email format
  if (
    rawCode.includes('form_identifier_invalid') ||
    rawCode.includes('form_email_invalid') ||
    rawMsg.includes('valid email') ||
    rawMsg.includes('invalid email')
  ) {
    return 'Please enter a valid email address.';
  }

  // 4. Missing required fields
  if (
    rawCode.includes('form_param_nil') ||
    rawCode.includes('missing') ||
    rawMsg.includes('required') ||
    rawMsg.includes('complete all')
  ) {
    return 'Please complete all required fields.';
  }

  return 'Something went wrong. Please try again later.';
}
