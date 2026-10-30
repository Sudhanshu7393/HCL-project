<div align="center">

# 🩺 CareConnect360
### **Enterprise-Grade WebRTC Telemedicine, Clinical Decision Support & EHR Platform**

[![GitHub Stars](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github)](https://github.com/Sudhanshu7393/HCL-project)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B%20LTS-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![WebRTC](https://img.shields.io/badge/WebRTC-P2P%20Encrypted-333333?style=for-the-badge&logo=webrtc&logoColor=white)](https://webrtc.org/)
[![IEEE Standard](https://img.shields.io/badge/Academic%20Compliance-IEEE%20Std%20830--1998-00629B?style=for-the-badge)](CareConnect360_SRS_Document.md)
[![License](https://img.shields.io/badge/License-MIT-teal?style=for-the-badge)](LICENSE)

<br/>

> **CareConnect360** is a full-stack, browser-native telemedicine platform engineered to bridge geographical healthcare gaps. It delivers low-latency peer-to-peer (P2P) WebRTC consultations, algorithmic drug-allergy contraindication detection (CDSS), tamper-resistant digital e-prescriptions with cryptographic QR codes, and a comprehensive Electronic Health Record (EHR) vault.

---

### 👨‍💻 **Developer Metadata**
**Solo Architect & Lead Developer:** **Sudhanshu Pandey**  
**University Roll No:** `240032001127`  
**Department:** Computer Science & Engineering  
**Institution:** **ABES Engineering College, Ghaziabad**  
**Academic Year:** 2026 – 2027  
**Official Project Specification:** [CareConnect360 IEEE Std 830-1998 SRS (PDF)](CareConnect360_SRS_Sudhanshu_Pandey.pdf) | [Word (.doc)](CareConnect360_SRS_Sudhanshu_Pandey.doc)

---

</div>

## 📑 Table of Contents
- [Key Features & Capabilities](#-key-features--capabilities)
- [System Architecture & Data Flow](#-system-architecture--data-flow)
- [Module Breakdown](#-module-breakdown)
- [Tech Stack](#-tech-stack)
- [Project Directory Structure](#-project-directory-structure)
- [Quick Start & Setup Guide](#-quick-start--setup-guide)
- [Demo Credentials](#-demo-credentials)
- [Academic IEEE SRS Specification](#-academic-ieee-srs-specification)
- [Security & Compliance Highlights](#-security--compliance-highlights)
- [Author & Acknowledgments](#-author--acknowledgments)

---

## 🌟 Key Features & Capabilities

- 🎥 **Peer-to-Peer WebRTC Teleconsultations**
  - Zero-install, high-definition audio & video communication running via native browser media APIs.
  - Interactive stream controls: Mic Mute/Unmute, Camera On/Off, Screen Sharing (`getDisplayMedia`), and Picture-in-Picture (PIP) Feed Swapping.
  - Dynamic consultation metadata syncing (booked doctor watermark, clinic affiliation, and consultation timer).

- 🧠 **Clinical Decision Support System (CDSS)**
  - Real-time intelligent allergy radar screening prescribed medications against patient known allergies (e.g., Penicillin, NSAIDs, Sulfa compounds).
  - Instant visual warnings for critical drug contraindications and dosage guidelines during live prescription drafting.

- 📝 **Digitally Signed e-Prescriptions**
  - In-call structured prescription builder (diagnosis, drug frequency, dosage, and special instructions).
  - Client-side cryptographic signature rendering and verified PDF compilation using `jsPDF`.
  - Verifiable QR code validation portal (`verify.html`) for pharmacies and patients.

- 🏥 **Specialist Discovery & Slot Reservation**
  - Multi-criteria filtering by medical department (Cardiology, Dermatology, Pediatrics, General Medicine), consultation fee, and doctor experience.
  - Conflict-free real-time calendar scheduling preventing double-booking.

- 📁 **EHR & Diagnostic Reports Repository**
  - In-call chat with multi-format report sharing (.pdf, .jpg, .png).
  - Structured vitals tracking: Blood Pressure, Heart Rate, SpO2, Temperature, and Blood Sugar with automated triage color badges.

---

## 🏛 System Architecture & Data Flow

```mermaid
flowchart TD
    subgraph Client ["Client Presentation Tier (HTML5 / ES6 / WebRTC)"]
        Patient["Patient Viewport\n(Booking, Consultation, EHR)"]
        Doctor["Doctor Viewport\n(OPD Queue, CDSS, Digital Rx)"]
    end

    subgraph Server ["Application & Signaling Tier (:5500)"]
        App["Node.js / Express Server"]
        PeerJS["WebRTC Signaling Engine\n(/peerjs Endpoint)"]
        Auth["JWT / Bcrypt Security Middleware"]
    end

    subgraph DataTier ["Persistence & Cloud Infrastructure"]
        DB[("Relational & NoSQL Datastores\n(db.json / SQLite / Firestore)")]
        STUN["Google STUN Servers\n(NAT & ICE Candidate Discovery)"]
    end

    Patient <-->|RESTful JSON Endpoints| App
    Doctor <-->|RESTful JSON Endpoints| App
    Patient <-->|WebRTC Signaling Handshake| PeerJS
    Doctor <-->|WebRTC Signaling Handshake| PeerJS
    Patient <-.->|ICE Discovery| STUN
    Doctor <-.->|ICE Discovery| STUN
    Patient <===>|Encrypted P2P Audio/Video/Screen Stream (DTLS-SRTP)| Doctor
    App <-->|CRUD Operations| DB
```

---

## 🧩 Module Breakdown

| Module ID | Module Name | Primary Responsibilities |
| :--- | :--- | :--- |
| **MOD-01** | **Patient Intake & Scheduling** | Specialist directory search, real-time availability calendar, symptom triage (Levels 1–3), and conflict-free booking. |
| **MOD-02** | **WebRTC P2P Media Room** | Native AV streams, audio/video track toggle, PIP swapping, screen sharing, and dynamic doctor watermark injection. |
| **MOD-03** | **CDSS & e-Prescription Pad** | Allergy cross-checking radar, digital doctor signature canvas, and verified PDF generation with QR validation. |
| **MOD-04** | **EHR & Reports Vault** | Vitals telemetry logging (BP, Heart Rate, SpO2), diagnostic report uploads, and longitudinal consultation history. |
| **MOD-05** | **Identity & RBAC Governance** | Multi-role authentication (Patient / Doctor), salted Bcrypt password hashing, and stateless JWT session handling. |

---

## 💻 Tech Stack

### **Frontend Tier**
- **Core:** HTML5, CSS3 (Custom Responsive Grid System), Modern Vanilla ES6+ Modules
- **Real-Time Video:** WebRTC 1.0 Native APIs, PeerJS Client SDK
- **Document Generation:** jsPDF (Client-side vector PDF generation), HTML5 Canvas
- **Icons & Typography:** FontAwesome 6.4, Google Fonts (Inter, JetBrains Mono)

### **Backend Tier**
- **Runtime:** Node.js (v18.x / v20.x LTS)
- **Framework:** Express.js 5.x
- **WebRTC Signaling:** ExpressPeerServer (`peer` package, mounted at `/peerjs`)
- **Secondary Backends (Academic / Multi-Stack Compliance):**
  - Python Flask Microservice (`backend_python/app.py`)
  - Django REST Framework App (`backend_django/`)
  - Enterprise Oracle / ANSI SQL Schema (`backend/schema_oracle.sql`)

### **Security & Protocols**
- **Authentication:** Stateless JWT (JSON Web Tokens) with HS256 algorithm
- **Password Security:** Salted Bcrypt hashing (10 rounds)
- **Streaming Security:** DTLS-SRTP 256-bit AES end-to-end media stream encryption

---

## 📂 Project Directory Structure

```plaintext
d:\HCL Project/
├── CareConnect360_SRS_Document.md           # Formal IEEE Std 830-1998 SRS Specification (Markdown)
├── CareConnect360_SRS.html                  # Interactive University-Ready SRS Presentation with Diagrams
├── CareConnect360_SRS_Sudhanshu_Pandey.pdf  # Downloadable Submission-Ready PDF (ABES Engg College)
├── CareConnect360_SRS_Sudhanshu_Pandey.doc  # Downloadable Editable Word Document
├── index.html                               # Landing page, doctor discovery, specialty catalog
├── consultation.html                        # WebRTC teleconsultation theater & CDSS prescription pad
├── dashboard.html                           # Patient & doctor consultation portal
├── login.html                               # Multi-role authentication interface
├── verify.html                              # QR-code prescription cryptographic verification
├── api-docs.html                            # Interactive RESTful API documentation
│
├── server.js                                # Primary Node.js/Express server & PeerJS signaling hub
├── video-call.js                            # WebRTC P2P media engine, feed swapping, screen sharing
├── prescription.js                          # CDSS drug radar, digital signature & jsPDF compiler
├── booking.js                               # Doctor filters, calendar slot selector, triage logic
├── dashboard.js                             # Vitals charts, records synchronizer & patient queue
├── auth.js                                  # Role-based access control & session management
├── toast-notification.js                    # Clinical toast alerts & emergency notification system
├── style.css                                # Design system (Healthcare Teal/Slate color palette)
│
├── data/                                    # Datastores for local demonstration & mock DB
│   ├── doctors.json                         # Verified specialist profiles & clinic affiliations
│   ├── departments.json                     # Clinical specialties & services
│   ├── medicines.json                       # Drug formulary & allergy contraindication data
│   └── lab_tests.json                       # Diagnostic test catalog
├── backend/                                 # Enterprise Oracle DDL & relational schema
│   ├── database.js                          # Local data access layer
│   └── schema_oracle.sql                    # Production Oracle DB relational tables (3NF)
├── backend_django/                          # Alternative Django ORM implementation
└── backend_python/                          # Lightweight Python REST service
```

---

## ⚡ Quick Start & Setup Guide

### **Prerequisites**
- [Node.js](https://nodejs.org/) (v18.0.0 or higher)
- [Git](https://git-scm.com/) installed on your machine

### **1. Clone the Repository**
```bash
git clone https://github.com/Sudhanshu7393/HCL-project.git
cd HCL-project
```

### **2. Install Dependencies**
```bash
npm install
```

### **3. Start the Server**
```bash
node server.js
```

### **4. Access the Application**
- 🌐 **Web App:** Open [http://localhost:5500](http://localhost:5500)
- 📚 **Interactive API Docs:** [http://localhost:5500/api-docs.html](http://localhost:5500/api-docs.html)
- 📄 **SRS Document Viewer:** [http://localhost:5500/CareConnect360_SRS.html](http://localhost:5500/CareConnect360_SRS.html)
- 📡 **WebRTC Signaling Endpoint:** `http://localhost:5500/peerjs`

---

## 🔑 Demo Credentials

| User Role | Email | Password | Access Privileges |
| :--- | :--- | :--- | :--- |
| **Patient** | `patient@careconnect.com` | `Patient@Care360` | Doctor search, booking, live video OPD, download signed Rx |
| **Doctor** | `doctor@careconnect.com` | `Doctor@Care360` | Patient triage review, conduct video call, CDSS Rx issuance |

*(Self-registration for new accounts is also available via `login.html`).*

---

## 📜 Academic IEEE SRS Specification

This project strictly adheres to the **IEEE Std 830-1998** standard for Software Requirements Specifications. The complete documentation includes:
- **Use Case Modeling:** Patient, Doctor, and System Administrator actor boundaries.
- **Data Flow Diagrams:** DFD Level 0 (System Context) and DFD Level 1 (Subsystem Decomposition).
- **Entity-Relationship Data Modeling:** Relational entities in 3rd Normal Form (3NF).
- **WebRTC Sequence Diagram:** SDP Offer/Answer negotiation over PeerJS signaling to direct media channel.

📥 **Downloadable Formats:**
- [Official PDF Specification (682 KB)](CareConnect360_SRS_Sudhanshu_Pandey.pdf)
- [Official Microsoft Word Document (.doc)](CareConnect360_SRS_Sudhanshu_Pandey.doc)
- [Raw Markdown Specification](CareConnect360_SRS_Document.md)

---

## 🛡 Security & Compliance Highlights

- **DTLS-SRTP Media Encryption:** Video and audio feeds are encrypted point-to-point; no media stream is ever routed through or stored on external application servers.
- **Bcrypt Password Storage:** Zero plaintext credentials; passwords hashed with salt cost factor 10.
- **Clinical Privacy (EHR):** Consultation records and diagnostic attachments are strictly isolated between the patient and their booked specialist.
- **Prescription Tamper-Proofing:** Each generated e-prescription contains an encoded SHA-256 hash stamp and verifiable QR code.

---

## 👤 Author & Acknowledgments

- **Sudhanshu Pandey**  
  - *Roll No:* `240032001127`  
  - *Degree:* B.Tech – Computer Science & Engineering (3rd Year)  
  - *Institution:* **ABES Engineering College, Ghaziabad**  
  - *GitHub:* [@Sudhanshu7393](https://github.com/Sudhanshu7393)

---

<div align="center">
  <sub>Built with ❤️ for modern, accessible, and intelligent healthcare delivery.</sub>
</div>
