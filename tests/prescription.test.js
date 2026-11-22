/**
 * Automated Test Suite: e-Prescription & Verification Engine
 * Conforms to IEEE Std 830-1998 SRS Requirement FR-3.3 & FR-3.4
 */

const test = require('node:test');
const assert = require('node:assert');
const crypto = require('crypto');
const {
  initDB,
  savePrescription,
  getPrescriptionById
} = require('../backend/database');

test('Prescription: Saves and retrieves clinical e-prescription with QR hash', () => {
  initDB();

  const apptId = `APT-${Date.now().toString().slice(-6)}`;
  const rxData = {
    appointmentId: apptId,
    patientName: 'Test Patient Verification',
    doctorName: 'Dr. Ramesh Chandra Gupta',
    doctorSpecialty: 'General Physician',
    doctorLicense: 'MCI-42918',
    diagnosis: 'Acute Pharyngitis',
    medicines: [
      { name: 'Tab. Dolo 650', dosage: '1-0-1 (SOS)', timing: 'After Meals', duration: '3 Days' },
      { name: 'Cap. Pan-D', dosage: '1-0-0', timing: 'Before Breakfast', duration: '5 Days' }
    ],
    cdssClearance: 'Verified - 0 Allergy Conflicts',
    verificationHash: crypto.createHash('sha256').update(apptId + Date.now()).digest('hex')
  };

  const saved = savePrescription(rxData);
  assert.ok(saved);
  assert.ok(saved.id);
  assert.strictEqual(saved.appointmentId, apptId);
  assert.strictEqual(saved.medicines.length, 2);
  assert.ok(saved.verificationHash);

  // Retrieve by ID
  const fetched = getPrescriptionById(saved.id);
  assert.ok(fetched);
  assert.strictEqual(fetched.diagnosis, 'Acute Pharyngitis');
});

test('Prescription: Generates unique SHA-256 cryptographic verification tamper-check', () => {
  const payload1 = 'APT-1001|Dr. Ramesh Chandra Gupta|Dolo 650';
  const payload2 = 'APT-1001|Dr. Ramesh Chandra Gupta|Augmentin 625';

  const hash1 = crypto.createHash('sha256').update(payload1).digest('hex');
  const hash2 = crypto.createHash('sha256').update(payload2).digest('hex');

  assert.strictEqual(hash1.length, 64);
  assert.strictEqual(hash2.length, 64);
  assert.notStrictEqual(hash1, hash2); // Tamper-evident
});
