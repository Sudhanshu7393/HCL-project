/**
 * CareConnect360 - Clinical Decision Support System (CDSS)
 * Intelligent Drug-Allergy Radar & Contraindication Screening Engine
 * Conforms to IEEE Std 830-1998 SRS Requirement FR-3.1
 */

// Drug Allergy & Contraindication Knowledge Base
const ALLERGY_KNOWLEDGE_BASE = [
  {
    allergyKey: "penicillin",
    aliases: ["penicillin", "amoxicillin", "ampicillin", "beta-lactam", "augmentin", "moxikind"],
    riskDrugs: [
      "amoxicillin", "augmentin", "ampicillin", "penicillin", "piperacillin",
      "clavulanic", "moxikind", "amox", "clavam", "ampiclox"
    ],
    crossReactive: ["cefixime", "cephalexin", "cefpodoxime", "cefuroxime"],
    severity: "CRITICAL",
    clinicalRisk: "Severe Anaphylaxis, Angioedema, Bronchospasm, and Urticaria",
    suggestedAlternatives: ["Azithromycin (Azithral)", "Clarithromycin", "Doxycycline", "Erythromycin"]
  },
  {
    allergyKey: "nsaid",
    aliases: ["nsaid", "nsaids", "aspirin", "ibuprofen", "diclofenac", "combiflam", "voveran"],
    riskDrugs: [
      "aspirin", "ibuprofen", "combiflam", "diclofenac", "voveran",
      "naproxen", "aceclofenac", "zerodol", "ketorolac", "piroxicam", "mefenamic"
    ],
    crossReactive: ["etoricoxib", "celecoxib"],
    severity: "HIGH",
    clinicalRisk: "Aspirin-Exacerbated Respiratory Disease (AERD), Severe Bronchospasm, and Peptic Ulceration",
    suggestedAlternatives: ["Paracetamol (Dolo 650)", "Tramadol (Ultracet)", "Acetaminophen"]
  },
  {
    allergyKey: "sulfa",
    aliases: ["sulfa", "sulfonamide", "cotrimoxazole", "septran", "bactrim"],
    riskDrugs: [
      "cotrimoxazole", "septran", "bactrim", "sulfamethoxazole",
      "sulfadiazine", "sulfasalazine", "dapsone"
    ],
    crossReactive: ["furosemide", "glimepiride"],
    severity: "CRITICAL",
    clinicalRisk: "Stevens-Johnson Syndrome (SJS), Toxic Epidermal Necrolysis, and Hemolytic Anemia",
    suggestedAlternatives: ["Ciprofloxacin (Cifran)", "Amoxicillin-Clavulanate", "Cefuroxime"]
  },
  {
    allergyKey: "paracetamol",
    aliases: ["paracetamol", "acetaminophen", "dolo", "crocin", "calpol"],
    riskDrugs: ["paracetamol", "acetaminophen", "dolo", "crocin", "calpol", "sumo"],
    crossReactive: [],
    severity: "HIGH",
    clinicalRisk: "Acute Hepatic Toxicity and Severe Cutaneous Adverse Reactions",
    suggestedAlternatives: ["Ibuprofen (if non-NSAID allergic)", "Mefenamic Acid", "Cold Compresses"]
  },
  {
    allergyKey: "quinolone",
    aliases: ["quinolone", "fluoroquinolone", "ciprofloxacin", "levofloxacin", "ofloxacin"],
    riskDrugs: [
      "ciprofloxacin", "cifran", "ciro", "levofloxacin", "levomac",
      "ofloxacin", "oflox", "norfloxacin", "moxifloxacin"
    ],
    crossReactive: [],
    severity: "HIGH",
    clinicalRisk: "Tendon Rupture, QT Prolongation, and Severe Hypersensitivity",
    suggestedAlternatives: ["Azithromycin", "Amoxicillin-Clavulanate", "Cefixime"]
  },
  {
    allergyKey: "codeine",
    aliases: ["codeine", "opioid", "tramadol", "morphine"],
    riskDrugs: ["codeine", "corex", "tramadol", "ultracet", "morphine"],
    crossReactive: ["fentanyl"],
    severity: "CRITICAL",
    clinicalRisk: "Severe Respiratory Depression, Angioedema, and Extreme Pruritus",
    suggestedAlternatives: ["Paracetamol", "Ibuprofen", "Topical Analgesics"]
  }
];

/**
 * Normalizes input text for fuzzy clinical matching
 */
function normalizeText(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Check if a single medicine triggers an allergy conflict
 * @param {string} medicineName - Brand or generic name (e.g., "Tab. Augmentin 625 Duo")
 * @param {Array<string>|string} patientAllergies - List or comma-separated string of known patient allergies
 * @returns {Object|null} Conflict details or null if safe
 */
function checkDrugAllergyConflict(medicineName, patientAllergies) {
  if (!medicineName || !patientAllergies) return null;

  // Convert patient allergies to clean array
  let allergiesList = [];
  if (Array.isArray(patientAllergies)) {
    allergiesList = patientAllergies;
  } else if (typeof patientAllergies === "string") {
    allergiesList = patientAllergies.split(",").map(s => s.trim());
  }

  const cleanMed = normalizeText(medicineName);
  if (!cleanMed) return null;

  for (const allergyItem of allergiesList) {
    const cleanAllergy = normalizeText(allergyItem);
    if (!cleanAllergy || cleanAllergy === "nkda" || cleanAllergy.includes("no known")) {
      continue;
    }

    // Match against knowledge base
    for (const kb of ALLERGY_KNOWLEDGE_BASE) {
      const allergyMatchesKB = kb.aliases.some(alias => cleanAllergy.includes(alias) || alias.includes(cleanAllergy));
      
      if (allergyMatchesKB) {
        // Direct drug check
        const directDrugConflict = kb.riskDrugs.some(drug => cleanMed.includes(drug));
        if (directDrugConflict) {
          return {
            isConflict: true,
            medicine: medicineName,
            allergyMatch: allergyItem,
            severity: kb.severity,
            clinicalRisk: kb.clinicalRisk,
            reason: `Prescribed medication "${medicineName}" contains ingredients in the ${kb.allergyKey.toUpperCase()} class, to which the patient has a reported allergy.`,
            suggestedAlternatives: kb.suggestedAlternatives
          };
        }

        // Cross-reactivity check
        const crossConflict = kb.crossReactive.some(drug => cleanMed.includes(drug));
        if (crossConflict) {
          return {
            isConflict: true,
            medicine: medicineName,
            allergyMatch: allergyItem,
            severity: "MODERATE",
            clinicalRisk: `Cross-Reactivity Risk: ${kb.clinicalRisk}`,
            reason: `Prescribed medication "${medicineName}" has known cross-reactivity with the ${kb.allergyKey.toUpperCase()} allergy class.`,
            suggestedAlternatives: kb.suggestedAlternatives
          };
        }
      }
    }
  }

  return null;
}

/**
 * Scan an entire list of prescribed medications against patient allergies
 * @param {Array<string|Object>} medicationsList - List of medicine names or objects { name: "..." }
 * @param {Array<string>|string} patientAllergies - Patient's reported allergies
 * @returns {Object} Comprehensive CDSS screening result
 */
function scanPrescriptionAllergies(medicationsList, patientAllergies) {
  const result = {
    screenedAt: new Date().toISOString(),
    patientAllergies: Array.isArray(patientAllergies) ? patientAllergies : [patientAllergies || "NKDA"],
    totalMedicationsScreened: 0,
    hasConflict: false,
    conflicts: [],
    safeMedications: []
  };

  if (!Array.isArray(medicationsList) || medicationsList.length === 0) {
    return result;
  }

  result.totalMedicationsScreened = medicationsList.length;

  for (const item of medicationsList) {
    const medName = typeof item === "string" ? item : (item.name || item.brandName || item.medicine || "");
    if (!medName) continue;

    const conflict = checkDrugAllergyConflict(medName, patientAllergies);
    if (conflict) {
      result.hasConflict = true;
      result.conflicts.push(conflict);
    } else {
      result.safeMedications.push(medName);
    }
  }

  return result;
}

module.exports = {
  checkDrugAllergyConflict,
  scanPrescriptionAllergies,
  ALLERGY_KNOWLEDGE_BASE
};
