const crypto = require('crypto');

/**
 * SHA-256 hash of input string
 */
function sha256(input) {
  if (typeof input !== 'string') {
    input = JSON.stringify(input);
  }
  return crypto.createHash('sha256').update(input).digest('hex');
}

/**
 * Create anonymized voter ID hash for vote
 */
function hashVoterId(voterId) {
  return sha256(voterId.toString());
}

/**
 * Verify fingerprint hash matches stored hash (constant-time comparison)
 */
function verifyFingerprintHash(inputHash, storedHash) {
  if (!inputHash || !storedHash) return false;
  const a = Buffer.from(String(inputHash), 'hex');
  const b = Buffer.from(String(storedHash), 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

module.exports = { sha256, hashVoterId, verifyFingerprintHash };
