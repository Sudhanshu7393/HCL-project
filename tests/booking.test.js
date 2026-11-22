/**
 * Automated Test Suite: Doctor Discovery & Appointment Scheduling
 * Conforms to IEEE Std 830-1998 SRS Requirement FR-1.2 & FR-1.3
 */

const test = require('node:test');
const assert = require('node:assert');
const {
  initDB,
  getDoctors,
  getDoctorById,
  getBookedSlots,
  createAppointment,
  getAppointmentsByUser,
  updateAppointmentStatus
} = require('../backend/database');

test('Booking: Doctors directory returns verified specialists catalog', () => {
  initDB();
  const doctors = getDoctors();
  assert.ok(Array.isArray(doctors));
  assert.ok(doctors.length >= 10);
  assert.ok(doctors.some(d => d.fullName.includes('Ramesh Chandra Gupta')));
  assert.ok(doctors.some(d => d.specialty === 'Cardiologist'));
});

test('Booking: Filter doctors by clinical department', () => {
  const cardiologists = getDoctors('Cardiology');
  assert.ok(cardiologists.length > 0);
  assert.ok(cardiologists.every(d => d.department.toLowerCase().includes('cardio') || d.specialty.toLowerCase().includes('cardio')));

  const dermatologists = getDoctors('Dermatology');
  assert.ok(dermatologists.length > 0);
  assert.ok(dermatologists.every(d => d.department.toLowerCase().includes('derma') || d.specialty.toLowerCase().includes('derma')));
});

test('Booking: Slot reservation and conflict prevention (Double-booking lock)', () => {
  const doc = getDoctors()[0];
  const testDate = '2026-12-01';
  const testSlot = '11:30 AM';

  // Create initial appointment
  const appt = createAppointment({
    patientId: 'pat-test-01',
    patientName: 'Test Patient Alpha',
    doctorId: doc.id,
    doctorName: doc.fullName,
    date: testDate,
    slotTime: testSlot,
    patientAllergies: 'Penicillin',
    status: 'confirmed'
  });

  assert.ok(appt.id);
  assert.strictEqual(appt.status, 'confirmed');

  // Verify slot is now locked
  const lockedSlots = getBookedSlots(doc.id, testDate);
  assert.ok(lockedSlots.includes(testSlot));
});

test('Booking: Appointment status transition (Lifecycle updates)', () => {
  const doc = getDoctors()[1];
  const appt = createAppointment({
    patientId: 'pat-test-02',
    doctorId: doc.id,
    date: '2026-12-02',
    slotTime: '02:00 PM',
    status: 'confirmed'
  });

  // Transition to completed
  const updated = updateAppointmentStatus(appt.id, 'completed');
  assert.ok(updated);
  assert.strictEqual(updated.status, 'completed');
});
