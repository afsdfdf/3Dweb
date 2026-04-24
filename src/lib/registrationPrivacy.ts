/**
 * Use one shared registration failure message to reduce account enumeration risk.
 *
 * Both the frontend auth form and backend afterOperation hook use this constant so
 * direct API clients cannot infer account existence from different error messages.
 */
export const registrationPrivacyMessage =
  'This email cannot be used for registration. Please try signing in or use password recovery.'
