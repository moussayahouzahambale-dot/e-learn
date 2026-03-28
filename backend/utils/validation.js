const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeText = (value) => {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
};

const hasMinLength = (value, minLength) => {
  return normalizeText(value).length >= minLength;
};

const isValidEmail = (email) => {
  return EMAIL_REGEX.test(normalizeText(email).toLowerCase());
};

module.exports = {
  normalizeText,
  hasMinLength,
  isValidEmail
};
