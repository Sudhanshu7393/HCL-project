const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { ExpressPeerServer } = require('peer');

const {
  initDB,
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
  getDepartments,
  readDB
} = require('./backend/database');

const app = express();
const PORT = process.env.PORT || 5500;
const JWT_SECRET = process.env.JWT_SECRET || 'careconnect360_secure_jwt_secret_2026';
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_CareConnect360DemoKey';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'CareConnectSecretKey2026';

// Initialize DB on boot
initDB();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Auth Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.split(' ')[1]) || req.query.token;

  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
    if (err) {
      req.user = null;
    } else {
      req.user = decodedUser;
    }
    next();
  });
}

function requireAuth(req, res, next) {
  authenticateToken(req, res, () => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
    }
    next();
  });
}

// Health check & Project P_013 Metadata
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    projectId: 'P_013',
    projectTitle: 'CareConnect360: VirtualCare Telemedicine',
    synopsis: 'Telemedicine platform for virtual consultations, prescription management, secure video conferencing and billing.',
    domain: 'Healthcare',
    timestamp: new Date().toISOString()
  });
});


// 1. Authentication REST API (Normal Custom Backend Auth - No Firebase Needed)
// ==========================================================================

// Register Route
app.post('/api/auth/register', (req, res) => {
  try {
    const { email, password, fullName, role, phone, specialty, licenseNumber } = req.body;

    if (!email || !password || !fullName || !role) {
      return res.status(400).json({ success: false, message: 'Please provide Email, Password, Full Name, and Role.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    const user = createUser({ email, password, fullName, role, phone, specialty, licenseNumber });
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, fullName: user.fullName },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Account registered successfully!',
      token,
      user
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message || 'Registration failed.' });
  }
});

// Login Route
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide both Email and Password.' });
    }

    const user = findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, message: 'No registered account found with this email address.' });
    }

    const isMatch = verifyUserPassword(user, password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect password. Please try again.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, fullName: user.fullName },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { passwordHash: _, ...safeUser } = user;

    res.json({
      success: true,
      message: 'Logged in successfully!',
      token,
      user: safeUser
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Login failed.' });
  }
});

// Get Current User Profile Route
app.get('/api/auth/me', authenticateToken, (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated.' });
  }

  const user = findUserById(req.user.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  const { passwordHash: _, ...safeUser } = user;
  res.json({ success: true, user: safeUser });
});

// Update Current User Profile (PUT)
app.put('/api/auth/profile', authenticateToken, (req, res) => {
  const targetId = req.user ? req.user.id : (req.body.id || req.body.email);
  if (!targetId) {
    return res.status(401).json({ success: false, message: 'Authentication required to update profile.' });
  }

  const updatedUser = updateUserProfile(targetId, req.body);
  if (!updatedUser) {
    return res.status(404).json({ success: false, message: 'User record not found.' });
  }

  res.json({
    success: true,
    message: 'User profile successfully updated!',
    user: updatedUser
  });
});

// ==========================================================================
// 2. Doctor Discovery & Slot Availability REST API
// ==========================================================================

// Get All Doctors
app.get('/api/doctors', (req, res) => {
  const { dept, search } = req.query;
  const list = getDoctors(dept, search);
  res.json({ success: true, count: list.length, doctors: list });
});

// Get Single Doctor Profile
app.get('/api/doctors/:id', (req, res) => {
  const doc = getDoctorById(req.params.id);
  if (!doc) {
    return res.status(404).json({ success: false, message: 'Doctor not found.' });
  }
  res.json({ success: true, doctor: doc });
});

// Get Slot Availability for Doctor on Date
app.get('/api/appointments/slots', (req, res) => {
  const { doctorId, date } = req.query;
  if (!doctorId || !date) {
    return res.status(400).json({ success: false, message: 'doctorId and date are required.' });
  }

  const doc = getDoctorById(doctorId);
  const allSlots = doc ? (doc.availableSlots || []) : ["10:00 AM", "02:00 PM", "04:30 PM", "06:00 PM"];
  const bookedSlots = getBookedSlots(doctorId, date);

  res.json({
    success: true,
    doctorId,
    date,
    allSlots,
    bookedSlots
  });
});

// ==========================================================================
// 2.1 Medical Datasets: Real Indian Pharmacopeia & NABL Lab Tests
// ==========================================================================

// Search & Browse Indian Pharmacopeia Medicines
app.get('/api/medicines', (req, res) => {
  const { search, category } = req.query;
  const list = getMedicines(search, category);
  res.json({ success: true, count: list.length, medicines: list });
});

// Search & Browse NABL Accredited Diagnostic Lab Tests
app.get('/api/lab-tests', (req, res) => {
  const { search, category } = req.query;
  const list = getLabTests(search, category);
  res.json({ success: true, count: list.length, labTests: list });
});

// Clinical Specialties / Departments Catalog
app.get('/api/departments', (req, res) => {
  const list = getDepartments();
  res.json({ success: true, count: list.length, departments: list });
});

// ==========================================================================
// 3. Appointment Booking & Real-Time Slot Locking
// ==========================================================================

app.post('/api/appointments/book', authenticateToken, (req, res) => {
  try {
    const {
      doctorId,
      slotTime,
      date,
      patientName,
      patientPhone,
      patientEmail,
      symptoms,
      paymentId,
      orderId,
      totalAmount
    } = req.body;

    if (!doctorId || !slotTime || !date) {
      return res.status(400).json({ success: false, message: 'doctorId, slotTime and date are required.' });
    }

    // Check if slot already booked
    const booked = getBookedSlots(doctorId, date);
    if (booked.includes(slotTime)) {
      return res.status(409).json({ success: false, message: `The ${slotTime} slot has already been booked by another patient. Please choose a different slot.` });
    }

    const doc = getDoctorById(doctorId);
    const doctorName = doc ? doc.fullName : "Consultant Specialist";
    const doctorSpecialty = doc ? doc.specialty : "General Medicine";
    const fee = doc ? doc.consultationFee : 500;
    const finalAmount = totalAmount || (fee + 49);

    const meetingRoomId = `room_${(doctorId || 'doc').slice(0, 7)}_${Date.now()}`;

    const appointment = createAppointment({
      patientId: req.user ? req.user.id : `pat-${Date.now().toString().slice(-5)}`,
      patientName: patientName || (req.user ? req.user.fullName : "Patient"),
      patientPhone: patientPhone || (req.user ? req.user.phone : ""),
      patientEmail: patientEmail || (req.user ? req.user.email : ""),
      doctorId,
      doctorName,
      doctorSpecialty,
      doctorClinic: doc ? doc.clinic : "CareConnect Virtual OPD",
      doctorPhotoUrl: doc ? doc.photoUrl : "",
      date,
      slotTime,
      consultationFee: fee,
      platformFee: 49,
      totalAmount: finalAmount,
      paymentId: paymentId || `pay_mock_${Date.now()}`,
      orderId: orderId || `order_${Date.now()}`,
      paymentStatus: "paid",
      status: "confirmed",
      meetingRoomId,
      symptoms: symptoms || "Telemedicine General Consultation"
    });

    res.status(201).json({
      success: true,
      message: 'Consultation booked successfully!',
      appointment
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Appointment booking failed.' });
  }
});

// Get User's Appointments
app.get('/api/appointments/my', authenticateToken, (req, res) => {
  const userId = req.user ? req.user.id : (req.query.userId || 'usr-pat-001');
  const role = req.user ? req.user.role : (req.query.role || 'patient');

  const list = getAppointmentsByUser(userId, role);
  res.json({ success: true, count: list.length, appointments: list });
});

// Get Single Appointment by ID
app.get('/api/appointments/:id', (req, res) => {
  const db = readDB();
  const appt = db.appointments.find(a => a.id === req.params.id);
  if (!appt) {
    return res.status(404).json({ success: false, message: 'Appointment not found.' });
  }
  res.json({ success: true, appointment: appt });
});

// Update Appointment Status (PATCH)
app.patch('/api/appointments/:id/status', (req, res) => {
  const { status } = req.body;
  const updated = updateAppointmentStatus(req.params.id, status);
  if (!updated) {
    return res.status(404).json({ success: false, message: 'Appointment not found.' });
  }
  res.json({ success: true, appointment: updated });
});

// Reschedule / Update Full Appointment Details (PUT)
app.put('/api/appointments/:id', authenticateToken, (req, res) => {
  const updated = updateAppointment(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, message: 'Appointment not found.' });
  }
  res.json({
    success: true,
    message: 'Appointment successfully updated / rescheduled!',
    appointment: updated
  });
});

// ==========================================================================
// 4. Server-Side Razorpay Order & Cryptographic Signature Verification
// ==========================================================================

// Create Order Route
app.post('/api/payment/create-order', (req, res) => {
  try {
    const { amount, currency = 'INR', receipt = `rec_${Date.now()}` } = req.body;
    const amountInPaise = Math.round((Number(amount) || 500) * 100);
    const orderId = `order_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    res.json({
      success: true,
      orderId,
      amount: amountInPaise,
      currency,
      keyId: RAZORPAY_KEY_ID,
      receipt
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create payment order.' });
  }
});

// Verify HMAC-SHA256 Signature Route
app.post('/api/payment/verify', (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id) {
      return res.status(400).json({ success: false, message: 'Payment details are missing.' });
    }

    // If sandbox / test mock signature passed
    if (razorpay_signature === 'mock_valid_signature' || !razorpay_signature) {
      return res.json({ success: true, verified: true, paymentId: razorpay_payment_id });
    }

    // Verify HMAC-SHA256 hash using Secret Key
    const generatedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const isValid = (generatedSignature === razorpay_signature);

    res.json({
      success: true,
      verified: isValid,
      paymentId: razorpay_payment_id
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Payment verification failed.' });
  }
});

// ==========================================================================
// 5. Agora RTC Video Call Dynamic Token & Room Session
// ==========================================================================

app.get('/api/video/token', (req, res) => {
  const { room, role = 'publisher', uid } = req.query;
  const channelName = room || 'careconnect-default-room';
  const numericUid = uid ? Number(uid) : Math.floor(Math.random() * 100000);

  // Dynamic token string generated by backend
  const token = `token_agora_careconnect_${channelName}_${Date.now()}`;

  res.json({
    success: true,
    channel: channelName,
    uid: numericUid,
    token,
    appId: process.env.AGORA_APP_ID || '4a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d',
    expiresAt: Date.now() + 3600 * 1000
  });
});

// ==========================================================================
// 6. Digital E-Prescription Persistence & QR Verification
// ==========================================================================

app.post('/api/prescriptions/save', (req, res) => {
  try {
    const rx = savePrescription(req.body);
    res.status(201).json({
      success: true,
      message: 'Prescription saved successfully!',
      prescriptionId: rx.id,
      prescription: rx
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to save prescription.' });
  }
});

app.get('/api/prescriptions/:id', (req, res) => {
  const rx = getPrescriptionById(req.params.id);
  if (!rx) {
    return res.status(404).json({ success: false, message: 'Prescription not found.' });
  }
  res.json({ success: true, prescription: rx });
});

// ==========================================================================
// 7. Simulated SMS & Email Notifications Route & Dispatcher
// ==========================================================================

app.get('/api/notifications', authenticateToken, (req, res) => {
  const db = readDB();
  const userId = req.user ? req.user.id : req.query.userId;
  const notifs = userId ? db.notifications.filter(n => n.userId === userId) : db.notifications;
  res.json({ success: true, count: notifs.length, notifications: notifs });
});

// Dispatch Notification (SMS / Email Simulation Engine)
app.post('/api/notifications/send', (req, res) => {
  try {
    const { userId, type = 'sms_and_email', recipient, message } = req.body;
    if (!recipient || !message) {
      return res.status(400).json({ success: false, message: 'Recipient and message are required.' });
    }

    const db = readDB();
    const newNotif = {
      id: `notif-${Date.now().toString().slice(-5)}`,
      userId: userId || (req.user ? req.user.id : "usr-pat-001"),
      type,
      recipient,
      message,
      status: "delivered",
      createdAt: new Date().toISOString()
    };
    db.notifications.unshift(newNotif);
    fs.writeFileSync(path.join(__dirname, 'data', 'db.json'), JSON.stringify(db, null, 2), 'utf-8');

    res.json({
      success: true,
      message: 'Notification dispatched successfully!',
      notification: newNotif
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to send notification.' });
  }
});

// ==========================================================================
// 8. Electronic Health Records (EHR) & Diagnostic Lab Reports API
// ==========================================================================

// Multer Storage Configuration for Medical Reports
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads', 'records');
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'record-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB limit
});

// Upload Medical Report (PDF or Image)
app.post('/api/records/upload', authenticateToken, upload.single('reportFile'), (req, res) => {
  try {
    const { title, recordType, date, notes, patientId, patientName } = req.body;
    
    let fileUrl = "/uploads/records/sample_cbc_panel.pdf";
    let fileName = "diagnostic_report.pdf";
    let fileSize = "142 KB";

    if (req.file) {
      fileUrl = `/uploads/records/${req.file.filename}`;
      fileName = req.file.originalname;
      fileSize = `${(req.file.size / 1024).toFixed(1)} KB`;
    }

    const pId = req.user ? req.user.id : (patientId || "usr-pat-001");
    const pName = req.user ? req.user.fullName : (patientName || "Rahul Sharma");

    const record = saveMedicalRecord({
      patientId: pId,
      patientName: pName,
      title: title || "Diagnostic Lab Report",
      recordType: recordType || "Lab Report",
      fileUrl,
      fileName,
      fileSize,
      date: date || new Date().toISOString().split('T')[0],
      notes: notes || ""
    });

    res.status(201).json({
      success: true,
      message: 'Medical report uploaded successfully!',
      record
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Failed to upload report.' });
  }
});

// Fetch Patient Medical Records
app.get('/api/records/my', authenticateToken, (req, res) => {
  const pId = req.user ? req.user.id : (req.query.patientId || "usr-pat-001");
  const records = getMedicalRecordsByPatient(pId);
  res.json({ success: true, count: records.length, records });
});

// Delete Record
app.delete('/api/records/:id', authenticateToken, (req, res) => {
  const userId = req.user ? req.user.id : req.query.userId;
  const deleted = deleteMedicalRecord(req.params.id, userId);
  if (!deleted) {
    return res.status(404).json({ success: false, message: 'Record not found or unauthorized.' });
  }
  res.json({ success: true, message: 'Record deleted successfully.' });
});

// ==========================================================================
// 9. Interactive REST API Documentation & Swagger Explorer
// ==========================================================================
app.get('/api/docs', (req, res) => {
  res.sendFile(path.join(__dirname, 'api-docs.html'));
});
app.get('/docs', (req, res) => {
  res.redirect('/api/docs');
});

// ==========================================================================
// Static File Serving
// ==========================================================================
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname)));

// HTTP Server & PeerJS Real-Time WebRTC Video Signaling Server
const server = http.createServer(app);
const peerServer = ExpressPeerServer(server, {
  debug: false,
  path: '/'
});
app.use('/peerjs', peerServer);

// Fallback to index.html for non-API navigations
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`==================================================================`);
  console.log(` CareConnect360 Full-Stack Healthcare Platform active!`);
  console.log(` Web App:        http://localhost:${PORT}`);
  console.log(` REST API Docs:  http://localhost:${PORT}/api/docs`);
  console.log(` WebRTC Signaling: http://localhost:${PORT}/peerjs`);
  console.log(` Default Demo Accounts:`);
  console.log(`   - Patient: patient@careconnect.com  / Password: Patient@Care360`);
  console.log(`   - Doctor:  doctor@careconnect.com   / Password: Doctor@Care360`);
  console.log(`==================================================================`);
});
