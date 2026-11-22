/**
 * Automated Test Suite: Security Governance, Sanitization & Rate Limiting
 * Conforms to IEEE Std 830-1998 SRS Section 5.2 (NFR Security)
 */

const test = require('node:test');
const assert = require('node:assert');

test('Security: XSS Script tag sanitization neutralizes malicious payloads', () => {
  function sanitizeInputString(str) {
    if (typeof str !== 'string') return str;
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .trim();
  }

  const maliciousInput = 'Rahul Sharma<script>alert("XSS Attack!");</script>';
  const sanitized = sanitizeInputString(maliciousInput);
  assert.strictEqual(sanitized, 'Rahul Sharma');
  assert.ok(!sanitized.includes('<script>'));
});

test('Security: Password policy enforces minimum complexity (SRS FR-1.1)', () => {
  const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

  assert.strictEqual(PASSWORD_REGEX.test('ValidPass123'), true);
  assert.strictEqual(PASSWORD_REGEX.test('short1'), false); // Too short
  assert.strictEqual(PASSWORD_REGEX.test('allcharactersonly'), false); // No numbers
  assert.strictEqual(PASSWORD_REGEX.test('123456789'), false); // No letters
});

test('Security: Email format validation rejects malformed inputs', () => {
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  assert.strictEqual(EMAIL_REGEX.test('user@careconnect.com'), true);
  assert.strictEqual(EMAIL_REGEX.test('invalid-email'), false);
  assert.strictEqual(EMAIL_REGEX.test('user@domain'), false);
  assert.strictEqual(EMAIL_REGEX.test('@missinguser.com'), false);
});

test('Security: In-memory Rate Limiting triggers 429 when threshold exceeded', () => {
  const rateLimitMap = new Map();
  function checkRateLimit(key, max, windowMs) {
    const now = Date.now();
    const record = rateLimitMap.get(key) || { count: 0, resetTime: now + windowMs };
    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + windowMs;
    } else {
      record.count++;
    }
    rateLimitMap.set(key, record);
    return record.count <= max;
  }

  const testKey = 'test_ip_192.168.1.1';
  const maxAttempts = 3;

  assert.strictEqual(checkRateLimit(testKey, maxAttempts, 10000), true); // 1
  assert.strictEqual(checkRateLimit(testKey, maxAttempts, 10000), true); // 2
  assert.strictEqual(checkRateLimit(testKey, maxAttempts, 10000), true); // 3
  assert.strictEqual(checkRateLimit(testKey, maxAttempts, 10000), false); // 4 - Exceeded (429)
});
