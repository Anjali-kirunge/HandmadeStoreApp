const env = require('../config/env');

const attempts = new Map();

function key(email) {
  return String(email).toLowerCase();
}

function isBlocked(email) {
  const attempt = attempts.get(key(email));
  if (!attempt) return false;
  if (attempt.count >= env.login.maxAttempts) {
    const elapsedMinutes = (Date.now() - attempt.firstFailure) / 60000;
    if (elapsedMinutes >= env.login.lockMinutes) {
      attempts.delete(key(email));
      return false;
    }
    return true;
  }
  return false;
}

function recordFailure(email) {
  const k = key(email);
  const existing = attempts.get(k);
  if (!existing) {
    attempts.set(k, { count: 1, firstFailure: Date.now() });
  } else {
    existing.count += 1;
  }
}

function reset(email) {
  attempts.delete(key(email));
}

module.exports = { isBlocked, recordFailure, reset };
