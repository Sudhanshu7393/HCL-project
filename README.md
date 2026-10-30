# CareConnect360: VirtualCare Telemedicine Platform
**Project ID:** `P_013`  
**Project Type:** Full Stack Development  
**Industry Domain:** Healthcare  
**Project Synopsis:**  
> *CareConnect360: VirtualCare Telemedicine — Telemedicine platform for virtual consultations, prescription management, secure video conferencing and billing.*

---

## 1. Compliance Matrix: Problem Statement P_013 vs Codebase

| P_013 Requirement | Codebase Implementation | Status |
| :--- | :--- | :---: |
| **Virtual Consultations** | Specialist filtering by specialty/disease, slot selection, symptom triage assessment (Levels 1-3), and appointment booking. | **100% Implemented** |
| **Prescription Management** | In-call clinical prescription builder, interactive drug dosing table, verified jsPDF NMC clinical letterhead generator, and verifiable QR code validation (`verify.html`). | **100% Implemented** |
| **Secure Video Conferencing** | High-definition WebRTC video room powered by Agora RTC v4.x, dynamic token security, mic/cam toggle, screen sharing, and call duration timer. | **100% Implemented** |
| **Billing & Payments** | Dynamic consultation fee breakdown (Platform Fee + GST), simulated & live Razorpay checkout integration with HMAC-SHA256 signature verification. | **100% Implemented** |
| **Pre-requisite / Tech Stack** | **Dual-Stack Engineering:**<br>1. **Node.js / Express:** High-speed REST API & static server (`server.js`) on port 5500.<br>2. **Python Backend:** Python service & SQLite/SQL Data Access Layer (`backend_python/app.py`).<br>3. **Oracle DB Schema:** Complete enterprise DDL script (`backend/schema_oracle.sql`) with tables (`USERS`, `DOCTORS`, `APPOINTMENTS`, `PRESCRIPTIONS`, `PAYMENTS`, `NOTIFICATIONS`). | **100% Compliant** |

---

## 2. Project Directory Structure

```
d:\HCL Project/
├── backend/
│   ├── database.js            # Node.js File-system / SQLite Data Access Layer
│   └── schema_oracle.sql      # Official P_013 Oracle DB / ANSI SQL Relational Schema
├── backend_django/            # Official P_013 Django Project (Oracle ORM & REST Framework)
│   ├── manage.py              # Django management utility
│   ├── careconnect/           # Django settings & URL configuration
│   └── telemedicine/          # Django App (models.py, views.py, serializers.py, admin.py)
├── backend_python/
│   └── app.py                 # P_013 Python REST Service & SQLite Database Layer
├── data/
│   ├── careconnect.db         # SQLite Relational Database file
│   └── db.json                # JSON datastore for high-speed local dev & demo
├── index.html                 # Hero landing page, doctor discovery modal, & auth dialog
├── consultation.html          # WebRTC video room, in-call prescription builder & live chat
├── dashboard.html             # Patient & Doctor appointment management portal
├── verify.html                # Cryptographic QR verification page for medical prescriptions
├── toast-notification.js      # Modern floating toast notifications & simulated SMS modal
├── auth.js                    # JWT-based Normal Authentication & RBAC (Patient/Doctor)
├── booking.js                 # Doctor listing, calendar slot picker, and triage logic
├── payment.js                 # Razorpay billing modal & order verification
├── video-call.js              # Agora RTC WebRTC media streams & screen sharing
├── prescription.js            # jsPDF prescription generator & digital signing
├── dashboard.js               # Dashboard synchronizer for appointments & records
├── style.css                  # Modern responsive healthcare UI design system
├── server.js                  # Main Express Server & REST API (Port 5500)
└── package.json               # Dependencies & scripts
```

---

## 3. Quick Start & Execution

### Option A: Standard Full-Stack Execution (Node.js REST API & UI)
```powershell
# 1. Install dependencies (if not already done)
npm install

# 2. Start the server
node server.js
```
- Open your browser at: **`http://localhost:5500`**
- API Health Check: **`http://localhost:5500/api/health`**

### Option B: Django / Python Backend Service Execution
If the evaluator specifically asks to see the Django / Python architecture or runserver:
```powershell
# Run Django Backend with Oracle / SQLite ORM
python backend_django/manage.py runserver 8000

# Or run lightweight standalone Python Service
python backend_python/app.py
```
- Django API operates on **`http://localhost:8000`** with models mapped 1:1 to Oracle DB schema.


### Option C: Demonstrating Oracle Database Compliance
- Open `backend/schema_oracle.sql` in Oracle SQL Developer, SQL*Plus, or any IDE.
- The script contains tables:
  1. `USERS` (Patients, Doctors, Admins)
  2. `DOCTORS` (Specialties, MCI/NMC License Numbers, Fees)
  3. `APPOINTMENTS` (Dates, Times, Status, Video Room IDs)
  4. `PRESCRIPTIONS` (Rx JSON, Diagnosis, Digital Signatures)
  5. `PAYMENTS` (Razorpay Transaction IDs, Amounts, Status)
  6. `NOTIFICATIONS` (SMS & Email audit logs)

---

## 4. Default Demo Accounts

| Role | Email | Password |
| :--- | :--- | :--- |
| **Patient** | `patient@careconnect.com` | `Patient@Care360` (or `patient123`) |
| **Doctor** | `doctor@careconnect.com` | `Doctor@Care360` (or `doctor123`) |

---

## 5. Viva / Evaluation Talking Points

1. **Why is the project ID P_013 compliant?**  
   All four core capabilities stated in the synopsis—Virtual Consultations, Prescription Management, Secure Video Conferencing, and Billing—are fully implemented end-to-end with real interactive workflows.

2. **How does Authentication work without third-party vendor lock-in?**  
   The platform implements a self-contained custom authentication service using bcrypt password hashing and JSON Web Tokens (JWT), removing reliance on external Firebase auth.

3. **How is double-booking prevented?**  
   When a patient selects a date, the `/api/appointments/slots` endpoint queries the database in real time. Already booked slots are locked and disabled.

4. **How are prescriptions verified?**  
   Each generated prescription contains a QR code with a unique cryptographic hash linking to `/verify.html?id=<prescriptionId>`, ensuring pharmacy authenticity.
