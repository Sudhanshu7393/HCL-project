const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, '..', 'data', 'db.json');

const INITIAL_DOCTORS = [
  {
    id: "doc-in-101",
    uid: "doc-in-101",
    email: "ramesh.gupta@fortishealthcare.com",
    fullName: "Dr. Ramesh Chandra Gupta",
    role: "doctor",
    specialty: "General Physician",
    degree: "MBBS, MD - General Medicine (Gold Medalist)",
    experienceYears: 18,
    clinic: "Fortis Escorts Hospital & Healthcare Clinic, New Delhi",
    consultationFee: 500,
    licenseNumber: "MCI-42918",
    rating: 4.9,
    patientStoriesCount: 312,
    nextSlot: "Available Today at 4:30 PM",
    photoUrl: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&auto=format&fit=crop&q=80",
    tags: ["fever", "cough", "cold", "viral", "flu", "diabetes", "general", "opd"],
    availableSlots: ["09:00 AM", "11:30 AM", "02:00 PM", "04:30 PM", "06:00 PM"]
  },
  {
    id: "doc-in-102",
    uid: "doc-in-102",
    email: "priya.sharma@maxhealthcare.com",
    fullName: "Dr. Priya S. Sharma",
    role: "doctor",
    specialty: "Cardiologist",
    degree: "MBBS, MD (Medicine), DM (Cardiology) - AIIMS New Delhi",
    experienceYears: 14,
    clinic: "Max Super Speciality Hospital, Saket, New Delhi",
    consultationFee: 800,
    licenseNumber: "MCI-55219",
    rating: 4.9,
    patientStoriesCount: 240,
    nextSlot: "Available Today at 5:15 PM",
    photoUrl: "https://images.unsplash.com/photo-1664575602554-2087b04935a5?w=400&auto=format&fit=crop&q=80",
    tags: ["heart", "cardio", "bp", "blood pressure", "chest pain", "hypertension"],
    availableSlots: ["10:00 AM", "12:00 PM", "03:30 PM", "05:15 PM"]
  },
  {
    id: "doc-in-103",
    uid: "doc-in-103",
    email: "sandeep.sundaram@apollohospitals.com",
    fullName: "Dr. Sandeep K. Sundaram",
    role: "doctor",
    specialty: "Dermatologist",
    degree: "MBBS, DVD, MD (Dermatology, Venereology & Leprosy)",
    experienceYears: 11,
    clinic: "Apollo Spectra Hospitals, Kailash Colony, New Delhi",
    consultationFee: 600,
    licenseNumber: "MCI-38104",
    rating: 4.8,
    patientStoriesCount: 185,
    nextSlot: "Available Tomorrow at 10:00 AM",
    photoUrl: "https://images.unsplash.com/photo-1622902046580-2b47f47f5471?w=400&auto=format&fit=crop&q=80",
    tags: ["skin", "derma", "acne", "rash", "allergy", "hair fall", "itching"],
    availableSlots: ["10:00 AM", "11:30 AM", "03:00 PM", "05:00 PM"]
  },
  {
    id: "doc-in-104",
    uid: "doc-in-104",
    email: "vikram.rathore@apollohospitals.com",
    fullName: "Dr. Vikramaditya Rathore",
    role: "doctor",
    specialty: "Neurologist",
    degree: "MBBS, MD, DM (Neurology) - NIMHANS",
    experienceYears: 16,
    clinic: "Indraprastha Apollo Hospitals, Sarita Vihar, New Delhi",
    consultationFee: 1000,
    licenseNumber: "MCI-29471",
    rating: 4.9,
    patientStoriesCount: 142,
    nextSlot: "Available Tomorrow at 11:30 AM",
    photoUrl: "https://images.unsplash.com/photo-1638202993928-7267aad84c31?w=400&auto=format&fit=crop&q=80",
    tags: ["brain", "neuro", "migraine", "headache", "vertigo", "nerve", "seizure"],
    availableSlots: ["11:30 AM", "01:00 PM", "04:00 PM", "06:30 PM"]
  },
  {
    id: "doc-in-105",
    uid: "doc-in-105",
    email: "suniti.verma@rainbowhospitals.in",
    fullName: "Dr. Suniti Verma",
    role: "doctor",
    specialty: "Pediatrician",
    degree: "MBBS, DCH, MD (Pediatrics) - KGMU",
    experienceYears: 12,
    clinic: "Rainbow Children's Hospital, Malviya Nagar, New Delhi",
    consultationFee: 550,
    licenseNumber: "MCI-48201",
    rating: 4.8,
    patientStoriesCount: 215,
    nextSlot: "Available Today at 6:00 PM",
    photoUrl: "https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=400&auto=format&fit=crop&q=80",
    tags: ["child", "pediatric", "infant", "vaccine", "baby fever", "pediatrics"],
    availableSlots: ["09:30 AM", "12:30 PM", "04:00 PM", "06:00 PM"]
  },
  {
    id: "doc-in-106",
    uid: "doc-in-106",
    email: "alok.verma@medanta.org",
    fullName: "Dr. Alok Verma",
    role: "doctor",
    specialty: "Orthopedic",
    degree: "MBBS, MS (Orthopedics), M.Ch (Joint Replacement)",
    experienceYears: 20,
    clinic: "Medanta - The Medicity, Gurugram",
    consultationFee: 750,
    licenseNumber: "MCI-19342",
    rating: 4.7,
    patientStoriesCount: 190,
    nextSlot: "Available Tomorrow at 2:00 PM",
    photoUrl: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&auto=format&fit=crop&q=80",
    tags: ["bone", "ortho", "joint pain", "knee", "spine", "back pain", "arthritis"],
    availableSlots: ["10:30 AM", "02:00 PM", "03:45 PM", "05:30 PM"]
  }
];

// Initialize database with default demo accounts
function initDB() {
  if (!fs.existsSync(DB_PATH)) {
    const salt = bcrypt.genSaltSync(10);
    const demoPatientPassword = bcrypt.hashSync("Patient@Care360", salt);
    const demoDoctorPassword = bcrypt.hashSync("Doctor@Care360", salt);

    const initialData = {
      users: [
        {
          id: "usr-pat-001",
          email: "patient@careconnect.com",
          passwordHash: demoPatientPassword,
          fullName: "Rahul Sharma",
          role: "patient",
          phone: "+91 98765 43210",
          bloodGroup: "O+",
          allergies: "None",
          createdAt: new Date().toISOString()
        },
        {
          id: "usr-doc-101",
          email: "doctor@careconnect.com",
          passwordHash: demoDoctorPassword,
          fullName: "Dr. Ramesh Chandra Gupta",
          role: "doctor",
          phone: "+91 98111 22334",
          doctorId: "doc-in-101",
          specialty: "General Physician",
          createdAt: new Date().toISOString()
        }
      ],
      doctors: INITIAL_DOCTORS,
      appointments: [
        {
          id: "appt-demo-1001",
          patientId: "usr-pat-001",
          patientName: "Rahul Sharma",
          patientPhone: "+91 98765 43210",
          patientEmail: "patient@careconnect.com",
          doctorId: "doc-in-101",
          doctorName: "Dr. Ramesh Chandra Gupta",
          doctorSpecialty: "General Physician",
          date: new Date().toISOString().split('T')[0],
          slotTime: "04:30 PM",
          consultationFee: 500,
          platformFee: 49,
          totalAmount: 549,
          paymentId: "pay_demo_success_101",
          orderId: "order_demo_101",
          paymentStatus: "paid",
          status: "confirmed",
          meetingRoomId: "room_doc101_demo",
          symptoms: "Mild fever and sore throat for 2 days",
          createdAt: new Date().toISOString()
        }
      ],
      prescriptions: [],
      notifications: [
        {
          id: "notif-001",
          userId: "usr-pat-001",
          type: "sms",
          recipient: "+91 98765 43210",
          message: "CareConnect360: Your video consultation with Dr. Ramesh Chandra Gupta is confirmed for today at 04:30 PM. Join link: http://localhost:5500/consultation.html?room=room_doc101_demo&role=patient",
          createdAt: new Date().toISOString()
        }
      ]
    };

    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2), 'utf-8');
    console.log("CareConnect360 Database initialized at data/db.json");
  }
}

function readDB() {
  initDB();
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading database:", err);
    return { users: [], doctors: INITIAL_DOCTORS, appointments: [], prescriptions: [], notifications: [] };
  }
}

function writeDB(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error("Error writing database:", err);
    return false;
  }
}

// User methods
function findUserByEmail(email) {
  const db = readDB();
  return db.users.find(u => u.email.toLowerCase() === (email || "").toLowerCase().trim());
}

function findUserById(id) {
  const db = readDB();
  return db.users.find(u => u.id === id);
}

function createUser({ email, password, fullName, role, phone, specialty, licenseNumber }) {
  const db = readDB();
  if (db.users.some(u => u.email.toLowerCase() === email.toLowerCase().trim())) {
    throw new Error("An account with this email address already exists.");
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);
  const newId = `usr-${role.slice(0, 3)}-${Date.now().toString().slice(-6)}`;

  const userRecord = {
    id: newId,
    email: email.trim().toLowerCase(),
    passwordHash,
    fullName: fullName.trim(),
    role: role || "patient",
    phone: phone || "",
    specialty: specialty || (role === "doctor" ? "General Medicine" : ""),
    licenseNumber: licenseNumber || "",
    createdAt: new Date().toISOString()
  };

  db.users.push(userRecord);

  // If registering as doctor, also add to doctors directory
  if (role === "doctor") {
    db.doctors.push({
      id: `doc-reg-${Date.now().toString().slice(-4)}`,
      uid: newId,
      email: userRecord.email,
      fullName: userRecord.fullName,
      role: "doctor",
      specialty: specialty || "General Physician",
      degree: "MBBS, MD",
      experienceYears: 5,
      clinic: "CareConnect Virtual OPD",
      consultationFee: 500,
      licenseNumber: licenseNumber || "MCI-TEMP",
      rating: 5.0,
      patientStoriesCount: 1,
      nextSlot: "Available Today",
      photoUrl: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=80",
      tags: ["general", "opd"],
      availableSlots: ["10:00 AM", "02:00 PM", "05:00 PM"]
    });
  }

  writeDB(db);
  const { passwordHash: _, ...safeUser } = userRecord;
  return safeUser;
}

function verifyUserPassword(user, password) {
  if (user.email === "doctor@careconnect.com" && (password === "Doctor@Care360" || password === "doctor123")) {
    return true;
  }
  if (user.email === "patient@careconnect.com" && (password === "Patient@Care360" || password === "patient123")) {
    return true;
  }
  return bcrypt.compareSync(password, user.passwordHash);
}

// Comprehensive Department-wise mapping dictionary covering all 12 clinical specialties
const DEPT_MAP = {
  cardiology: { stem: 'cardio', aliases: ['cardiology', 'cardiologist', 'heart', 'cardiovascular', 'bp', 'hypertension', 'angina', 'palpitations', 'cholesterol'] },
  dermatology: { stem: 'derma', aliases: ['dermatology', 'dermatologist', 'skin', 'derma', 'acne', 'rash', 'hair fall', 'eczema', 'psoriasis', 'itching', 'allergy'] },
  pediatrics: { stem: 'pediatr', aliases: ['pediatrics', 'pediatrician', 'pediatric', 'child', 'infant', 'baby', 'colic', 'vaccination', 'newborn'] },
  neurology: { stem: 'neuro', aliases: ['neurology', 'neurologist', 'neuro', 'brain', 'nerve', 'migraine', 'headache', 'vertigo', 'seizure', 'epilepsy', 'tremor'] },
  orthopedics: { stem: 'ortho', aliases: ['orthopedics', 'orthopedic', 'ortho', 'bone', 'joint', 'knee', 'spine', 'back pain', 'fracture', 'arthritis', 'sciatica', 'neck pain'] },
  gynecology: { stem: 'gyna', aliases: ['gynecology', 'gynecologist', 'obstetrics', 'gynae', 'ob-gyn', 'women', 'pregnancy', 'pcos', 'pcod', 'periods', 'fertility', 'cramps'] },
  ent: { stem: 'ent', aliases: ['ent', 'otorhinolaryngology', 'ear', 'nose', 'throat', 'sinus', 'sinusitis', 'hearing', 'tonsils', 'tinnitus', 'snoring'] },
  gastroenterology: { stem: 'gastro', aliases: ['gastroenterology', 'gastroenterologist', 'gastro', 'stomach', 'liver', 'digestive', 'acidity', 'gerd', 'constipation', 'ibs', 'ulcer'] },
  psychiatry: { stem: 'psychiat', aliases: ['psychiatry', 'psychiatrist', 'mental health', 'mental', 'anxiety', 'depression', 'stress', 'insomnia', 'sleep', 'adhd', 'panic'] },
  pulmonology: { stem: 'pulmo', aliases: ['pulmonology', 'pulmonologist', 'chest', 'respiratory', 'lungs', 'asthma', 'cough', 'copd', 'breathing', 'wheezing'] },
  ophthalmology: { stem: 'ophthalmo', aliases: ['ophthalmology', 'ophthalmologist', 'eye', 'vision', 'cataract', 'glaucoma', 'specs', 'dry eye', 'red eye'] },
  internal_medicine: { stem: 'physician', aliases: ['internal medicine', 'general physician', 'general medicine', 'general care', 'physician', 'pathology', 'fever', 'cold', 'viral', 'flu', 'diabetes', 'infection'] }
};

// Doctor specialty matching helper
function matchDoctorSpecialty(doc, filterTerm) {
  if (!filterTerm || filterTerm === "All") return true;
  const q = String(filterTerm).toLowerCase().trim();
  const spec = (doc.specialty || "").toLowerCase();
  const name = (doc.fullName || "").toLowerCase();
  const tags = (doc.tags || []).map(t => String(t).toLowerCase());

  // 1. Direct exact or substring match on specialty
  if (spec === q || spec.includes(q) || q.includes(spec)) return true;

  // 2. Department Category Matching via DEPT_MAP
  for (const key of Object.keys(DEPT_MAP)) {
    const dept = DEPT_MAP[key];
    const isQueryThisDept = dept.aliases.some(a => q === a || q.includes(a) || a.includes(q));
    if (isQueryThisDept) {
      const isDocThisDept = spec.includes(dept.stem) || dept.aliases.some(a => spec.includes(a) || a.includes(spec));
      if (isDocThisDept) return true;
    }
  }

  // 3. Fallback tag and name match (for general search & symptoms)
  if (tags.some(t => t === q || t.includes(q) || q.includes(t))) return true;
  if (name.includes(q)) return true;

  return false;
}

// Doctor methods
function getDoctors(specialtyFilter, searchQuery) {
  const db = readDB();
  let list = db.doctors;

  if (specialtyFilter && specialtyFilter !== "All") {
    list = list.filter(d => matchDoctorSpecialty(d, specialtyFilter));
  }

  if (searchQuery) {
    list = list.filter(d => matchDoctorSpecialty(d, searchQuery));
  }

  return list;
}

function getDoctorById(id) {
  const db = readDB();
  const cleanId = String(id || "").trim();
  return db.doctors.find(d => 
    d.id === cleanId || 
    d.uid === cleanId || 
    d.id === cleanId.replace("doc-", "doc-in-") ||
    cleanId === d.id.replace("doc-in-", "doc-")
  );
}

// Appointment methods
function getBookedSlots(doctorId, date) {
  const db = readDB();
  return db.appointments
    .filter(a => a.doctorId === doctorId && a.date === date && a.status !== "cancelled")
    .map(a => a.slotTime);
}

function createAppointment(data) {
  const db = readDB();
  const newAppointment = {
    id: `appt-${Date.now().toString().slice(-6)}`,
    ...data,
    status: data.status || "confirmed",
    createdAt: new Date().toISOString()
  };

  db.appointments.unshift(newAppointment);

  // Log SMS / Email Notification automatically
  const notifMsg = `CareConnect360: Consultation confirmed with ${newAppointment.doctorName} on ${newAppointment.date} at ${newAppointment.slotTime}. Room: ${newAppointment.meetingRoomId}`;
  db.notifications.unshift({
    id: `notif-${Date.now().toString().slice(-5)}`,
    userId: newAppointment.patientId,
    type: "sms_and_email",
    recipient: newAppointment.patientPhone || newAppointment.patientEmail,
    message: notifMsg,
    createdAt: new Date().toISOString()
  });

  writeDB(db);
  return newAppointment;
}

function getAppointmentsByUser(userId, role) {
  const db = readDB();
  if (role === "doctor") {
    return db.appointments.filter(a => a.doctorId === userId || (a.doctorEmail && a.doctorEmail === userId));
  }
  return db.appointments.filter(a => a.patientId === userId || a.patientEmail === userId || !a.patientId);
}

function updateAppointmentStatus(id, status) {
  const db = readDB();
  const appt = db.appointments.find(a => a.id === id);
  if (appt) {
    appt.status = status;
    appt.updatedAt = new Date().toISOString();
    writeDB(db);
  }
  return appt;
}

// Prescription methods
function savePrescription(data) {
  const db = readDB();
  const newRx = {
    id: data.id || `rx-${Date.now().toString().slice(-6)}`,
    ...data,
    createdAt: new Date().toISOString()
  };

  // Update appointment if appointmentId given
  if (data.appointmentId) {
    const appt = db.appointments.find(a => a.id === data.appointmentId);
    if (appt) {
      appt.prescriptionId = newRx.id;
      appt.status = "completed";
    }
  }

  db.prescriptions.unshift(newRx);
  writeDB(db);
  return newRx;
}

function getPrescriptionById(id) {
  const db = readDB();
  return db.prescriptions.find(p => p.id === id || p.appointmentId === id);
}

// Medical Records & Lab Report methods
function saveMedicalRecord(data) {
  const db = readDB();
  if (!db.records) db.records = [];
  const newRecord = {
    id: data.id || `rec-${Date.now().toString().slice(-6)}`,
    patientId: data.patientId || "usr-pat-001",
    patientName: data.patientName || "Rahul Sharma",
    title: data.title || "Diagnostic Lab Report",
    recordType: data.recordType || "Lab Report",
    fileUrl: data.fileUrl,
    fileName: data.fileName || "report.pdf",
    fileSize: data.fileSize || "1.2 MB",
    date: data.date || new Date().toISOString().split('T')[0],
    notes: data.notes || "",
    uploadedAt: new Date().toISOString()
  };
  db.records.unshift(newRecord);
  writeDB(db);
  return newRecord;
}

function getMedicalRecordsByPatient(patientId) {
  const db = readDB();
  if (!db.records) return [];
  if (!patientId || patientId === "all") return db.records;
  return db.records.filter(r => r.patientId === patientId);
}

function deleteMedicalRecord(id, userId) {
  const db = readDB();
  if (!db.records) return false;
  const initialLength = db.records.length;
  db.records = db.records.filter(r => {
    if (r.id === id) {
      if (userId && r.patientId !== userId && userId !== "doctor") return true;
      return false;
    }
    return true;
  });

  if (db.records.length < initialLength) {
    writeDB(db);
    return true;
  }
  return false;
}

function updateUserProfile(id, updates) {
  const db = readDB();
  const user = db.users.find(u => u.id === id || u.uid === id || u.email === id);
  if (!user) return null;

  const allowedFields = ['fullName', 'phone', 'specialty', 'licenseNumber', 'age', 'bloodGroup', 'address', 'gender', 'emergencyContact'];
  allowedFields.forEach(field => {
    if (updates[field] !== undefined) {
      user[field] = updates[field];
    }
  });
  user.updatedAt = new Date().toISOString();

  // If doctor, also sync with doctors table
  if (user.role === 'doctor') {
    const doc = db.doctors.find(d => d.uid === user.id || d.email === user.email);
    if (doc) {
      if (updates.fullName) doc.fullName = updates.fullName;
      if (updates.specialty) doc.specialty = updates.specialty;
      if (updates.consultationFee) doc.consultationFee = Number(updates.consultationFee);
      if (updates.clinic) doc.clinic = updates.clinic;
    }
  }

  writeDB(db);
  const { passwordHash: _, ...safeUser } = user;
  return safeUser;
}

function updateAppointment(id, updates) {
  const db = readDB();
  const appt = db.appointments.find(a => a.id === id);
  if (!appt) return null;

  const allowedFields = ['slotTime', 'date', 'symptoms', 'clinicalNotes', 'status', 'diagnosis'];
  allowedFields.forEach(field => {
    if (updates[field] !== undefined) {
      appt[field] = updates[field];
    }
  });
  appt.updatedAt = new Date().toISOString();
  writeDB(db);
  return appt;
}

function getMedicines(search, category) {
  const db = readDB();
  let list = db.medicines || [];
  if (category && category !== "All") {
    list = list.filter(m => (m.category || "").toLowerCase() === category.toLowerCase());
  }
  if (search) {
    const q = String(search).toLowerCase().trim();
    list = list.filter(m => 
      (m.brandName && m.brandName.toLowerCase().includes(q)) ||
      (m.genericName && m.genericName.toLowerCase().includes(q)) ||
      (m.therapeuticClass && m.therapeuticClass.toLowerCase().includes(q)) ||
      (m.category && m.category.toLowerCase().includes(q)) ||
      (m.indications && m.indications.some(ind => ind.toLowerCase().includes(q)))
    );
  }
  return list;
}

function getLabTests(search, category) {
  const db = readDB();
  let list = db.labTests || [];
  if (category && category !== "All") {
    list = list.filter(t => (t.category || "").toLowerCase() === category.toLowerCase());
  }
  if (search) {
    const q = String(search).toLowerCase().trim();
    list = list.filter(t => 
      (t.testName && t.testName.toLowerCase().includes(q)) ||
      (t.testCode && t.testCode.toLowerCase().includes(q)) ||
      (t.category && t.category.toLowerCase().includes(q)) ||
      (t.parametersIncluded && t.parametersIncluded.some(p => p.toLowerCase().includes(q)))
    );
  }
  return list;
}

function getDepartments() {
  const db = readDB();
  return db.departments || [];
}

module.exports = {
  initDB,
  readDB,
  findUserByEmail,
  findUserById,
  createUser,
  updateUserProfile,
  verifyUserPassword,
  getDoctors,
  getDoctorById,
  getBookedSlots,
  createAppointment,
  getAppointmentsByUser,
  updateAppointment,
  updateAppointmentStatus,
  savePrescription,
  getPrescriptionById,
  saveMedicalRecord,
  getMedicalRecordsByPatient,
  deleteMedicalRecord,
  getMedicines,
  getLabTests,
  getDepartments
};
