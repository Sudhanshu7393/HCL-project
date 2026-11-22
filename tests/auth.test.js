/**
 * Automated Test Suite: Authentication & User Governance
 * Conforms to IEEE Std 830-1998 SRS Requirement FR-1.1 & FR-1.2
 */

const test = require('node:test');
const assert = require('node:assert');
const jwt = require('jsonwebtoken');
const {
  initDB,
  findUserByEmail,
  createUser,
  verifyUserPassword
} = require('../backend/database');

const JWT_SECRET = 'careconnect360_secure_jwt_secret_2026';

test('Auth: Database initializes with default demo accounts', () => {
  initDB();
  const patient = findUserByEmail('patient@careconnect.com');
  const doctor = findUserByEmail('doctor@careconnect.com');

  assert.ok(patient !== null);
  assert.strictEqual(patient.role, 'patient');
  assert.ok(doctor !== null);
  assert.strictEqual(doctor.role, 'doctor');
});

test('Auth: Password verification compares bcrypt hash accurately', () => {
  const patient = findUserByEmail('patient@careconnect.com');
  assert.strictEqual(verifyUserPassword(patient, 'Patient@Care360'), true);
  assert.strictEqual(verifyUserPassword(patient, 'WrongPassword123'), false);
});

test('Auth: Successfully creates new user with hashed password and role assignment', () => {
  const testEmail = `test_user_${Date.now()}@example.com`;
  const newUser = createUser({
    email: testEmail,
    password: 'SecurePassword@2026',
    fullName: 'Test Automation User',
    role: 'patient',
    phone: '+91 9876543210'
  });

  assert.ok(newUser);
  assert.strictEqual(newUser.email, testEmail);
  assert.strictEqual(newUser.role, 'patient');
  assert.ok(newUser.id);
  // Ensure plaintext password is NOT leaked in return object
  assert.strictEqual(newUser.password, undefined);
  const savedInDb = findUserByEmail(testEmail);
  assert.ok(savedInDb.passwordHash.startsWith('$2')); // Bcrypt hash signature
});

test('Auth: Rejects registration with existing email', () => {
  assert.throws(() => {
    createUser({
      email: 'patient@careconnect.com',
      password: 'Password123',
      fullName: 'Duplicate Patient',
      role: 'patient'
    });
  }, /already exists/);
});

test('Auth: JWT generation and stateless signature validation', () => {
  const payload = { id: 'usr-101', email: 'test@careconnect.com', role: 'patient' };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

  assert.ok(typeof token === 'string');

  const decoded = jwt.verify(token, JWT_SECRET);
  assert.strictEqual(decoded.id, 'usr-101');
  assert.strictEqual(decoded.email, 'test@careconnect.com');
  assert.strictEqual(decoded.role, 'patient');

  // Verify rejection with wrong secret
  assert.throws(() => {
    jwt.verify(token, 'wrong_secret_key');
  });
});
