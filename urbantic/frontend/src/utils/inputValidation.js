const personNamePattern = /^\p{L}(?:[\p{L}' -]*\p{L})?$/u;
const phonePattern = /^\+?[0-9](?:[0-9 ()-]*[0-9])?$/;

export function sanitizePersonName(value) {
  return value.replace(/[^\p{L}' -]/gu, '').replace(/\s{2,}/g, ' ');
}

export function sanitizePhone(value) {
  return value.replace(/[^0-9+() -]/g, '').slice(0, 30);
}

export function isValidPersonName(value, minLength = 2) {
  const normalized = value.trim();
  return normalized.length >= minLength && personNamePattern.test(normalized);
}

export function isValidPhone(value) {
  const normalized = value.trim();
  return !normalized || (normalized.length >= 7 && phonePattern.test(normalized));
}

export function getApiErrorMessage(apiError, fallback) {
  const response = apiError.response?.data;
  const fieldError = response?.errors?.[0]?.message;
  return fieldError || response?.message || fallback;
}
