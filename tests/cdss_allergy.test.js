/**
 * Automated Test Suite: CDSS Drug-Allergy Radar Engine
 * Conforms to IEEE Std 830-1998 SRS Requirement FR-3.1
 */

const test = require('node:test');
const assert = require('node:assert');
const {
  checkDrugAllergyConflict,
  scanPrescriptionAllergies,
  ALLERGY_KNOWLEDGE_BASE
} = require('../backend/cdss_radar');

test('CDSS Radar: Knowledge Base is properly initialized with core allergy classes', () => {
  assert.ok(Array.isArray(ALLERGY_KNOWLEDGE_BASE));
  assert.ok(ALLERGY_KNOWLEDGE_BASE.length >= 5);
  const keys = ALLERGY_KNOWLEDGE_BASE.map(k => k.allergyKey);
  assert.ok(keys.includes('penicillin'));
  assert.ok(keys.includes('nsaid'));
  assert.ok(keys.includes('sulfa'));
  assert.ok(keys.includes('paracetamol'));
});

test('CDSS Radar: Detects CRITICAL Penicillin allergy conflict with Augmentin (Amoxicillin)', () => {
  const result = checkDrugAllergyConflict('Tab. Augmentin 625 DUO', ['Penicillin']);
  assert.ok(result !== null);
  assert.strictEqual(result.isConflict, true);
  assert.strictEqual(result.severity, 'CRITICAL');
  assert.ok(result.clinicalRisk.includes('Anaphylaxis'));
  assert.ok(result.suggestedAlternatives.some(alt => alt.toLowerCase().includes('azithromycin')));
});

test('CDSS Radar: Detects HIGH NSAID allergy conflict with Combiflam (Ibuprofen)', () => {
  const result = checkDrugAllergyConflict('Combiflam Tablet', ['Aspirin', 'NSAIDs']);
  assert.ok(result !== null);
  assert.strictEqual(result.isConflict, true);
  assert.strictEqual(result.severity, 'HIGH');
  assert.ok(result.suggestedAlternatives.some(alt => alt.toLowerCase().includes('paracetamol')));
});

test('CDSS Radar: Detects CRITICAL Sulfa allergy conflict with Septran (Cotrimoxazole)', () => {
  const result = checkDrugAllergyConflict('Septran DS Tablet', ['Sulfa Drugs']);
  assert.ok(result !== null);
  assert.strictEqual(result.isConflict, true);
  assert.strictEqual(result.severity, 'CRITICAL');
  assert.ok(result.clinicalRisk.includes('Stevens-Johnson'));
});

test('CDSS Radar: Clears safe medications without false positives', () => {
  // Paracetamol given to patient allergic to Penicillin only -> SAFE
  const result = checkDrugAllergyConflict('Dolo 650 (Paracetamol)', ['Penicillin']);
  assert.strictEqual(result, null);

  // Pantoprazole given to patient allergic to NSAIDs -> SAFE
  const safeResult = checkDrugAllergyConflict('Pan-D Capsule', ['NSAIDs']);
  assert.strictEqual(safeResult, null);
});

test('CDSS Radar: Handles NKDA (No Known Drug Allergies) safely', () => {
  const result = checkDrugAllergyConflict('Tab. Augmentin 625 DUO', ['NKDA', 'No Known Allergies']);
  assert.strictEqual(result, null);
});

test('CDSS Radar: Bulk Prescription Screening identifies conflicts and safe items', () => {
  const draftedMedications = [
    { name: 'Tab. Augmentin 625 DUO' },
    { name: 'Tab. Dolo 650' },
    { name: 'Cap. Pan-D' }
  ];
  const patientAllergies = ['Penicillin'];

  const screening = scanPrescriptionAllergies(draftedMedications, patientAllergies);

  assert.strictEqual(screening.hasConflict, true);
  assert.strictEqual(screening.totalMedicationsScreened, 3);
  assert.strictEqual(screening.conflicts.length, 1);
  assert.strictEqual(screening.conflicts[0].medicine, 'Tab. Augmentin 625 DUO');
  assert.strictEqual(screening.safeMedications.length, 2);
  assert.ok(screening.safeMedications.includes('Tab. Dolo 650'));
});

test('CDSS Radar: Cross-reactivity detection flags Cefixime for Penicillin-allergic patients', () => {
  const result = checkDrugAllergyConflict('Cefixime 200mg', ['Penicillin']);
  assert.ok(result !== null);
  assert.strictEqual(result.isConflict, true);
  assert.strictEqual(result.severity, 'MODERATE');
  assert.ok(result.reason.includes('cross-reactivity'));
});
