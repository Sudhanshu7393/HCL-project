-- =============================================================================
-- CareConnect360: VirtualCare Telemedicine Platform
-- Project ID: P_013 | Track: Healthcare | Type: Full Stack Development
-- Enterprise Relational Database Schema (Oracle DB / ANSI SQL Compliant)
-- =============================================================================

-- Drop existing tables (in dependency order)
BEGIN
   EXECUTE IMMEDIATE 'DROP TABLE NOTIFICATIONS CASCADE CONSTRAINTS';
EXCEPTION WHEN OTHERS THEN NULL;
END;
/
BEGIN
   EXECUTE IMMEDIATE 'DROP TABLE PRESCRIPTIONS CASCADE CONSTRAINTS';
EXCEPTION WHEN OTHERS THEN NULL;
END;
/
BEGIN
   EXECUTE IMMEDIATE 'DROP TABLE PAYMENTS CASCADE CONSTRAINTS';
EXCEPTION WHEN OTHERS THEN NULL;
END;
/
BEGIN
   EXECUTE IMMEDIATE 'DROP TABLE APPOINTMENTS CASCADE CONSTRAINTS';
EXCEPTION WHEN OTHERS THEN NULL;
END;
/
BEGIN
   EXECUTE IMMEDIATE 'DROP TABLE DOCTORS CASCADE CONSTRAINTS';
EXCEPTION WHEN OTHERS THEN NULL;
END;
/
BEGIN
   EXECUTE IMMEDIATE 'DROP TABLE USERS CASCADE CONSTRAINTS';
EXCEPTION WHEN OTHERS THEN NULL;
END;
/

-- -----------------------------------------------------------------------------
-- 1. Table: USERS (Patients, Doctors, Medical Administrators)
-- -----------------------------------------------------------------------------
CREATE TABLE USERS (
    USER_ID         VARCHAR2(64) PRIMARY KEY,
    EMAIL           VARCHAR2(128) NOT NULL UNIQUE,
    PASSWORD_HASH   VARCHAR2(256) NOT NULL,
    FULL_NAME       VARCHAR2(128) NOT NULL,
    ROLE            VARCHAR2(20) CHECK (ROLE IN ('patient', 'doctor', 'admin')),
    PHONE           VARCHAR2(20),
    BLOOD_GROUP     VARCHAR2(8),
    ALLERGIES       VARCHAR2(256) DEFAULT 'None Reported',
    CREATED_AT      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 2. Table: DOCTORS (MCI/NMC Credentialed Clinical Specialists)
-- -----------------------------------------------------------------------------
CREATE TABLE DOCTORS (
    DOCTOR_ID          VARCHAR2(64) PRIMARY KEY,
    USER_ID            VARCHAR2(64) REFERENCES USERS(USER_ID) ON DELETE CASCADE,
    FULL_NAME          VARCHAR2(128) NOT NULL,
    SPECIALTY          VARCHAR2(64) NOT NULL,
    DEGREE             VARCHAR2(128) NOT NULL,
    EXPERIENCE_YEARS   NUMBER(3) DEFAULT 5,
    CLINIC             VARCHAR2(256) NOT NULL,
    CONSULTATION_FEE   NUMBER(8, 2) DEFAULT 500.00,
    LICENSE_NUMBER     VARCHAR2(64) NOT NULL UNIQUE,
    RATING             NUMBER(2, 1) DEFAULT 4.9,
    PHOTO_URL          VARCHAR2(512),
    AVAILABLE_SLOTS    VARCHAR2(512),
    CREATED_AT         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 3. Table: APPOINTMENTS (Virtual Teleconsultation Booking & Real-time Slots)
-- -----------------------------------------------------------------------------
CREATE TABLE APPOINTMENTS (
    APPOINTMENT_ID     VARCHAR2(64) PRIMARY KEY,
    PATIENT_ID         VARCHAR2(64) REFERENCES USERS(USER_ID),
    DOCTOR_ID          VARCHAR2(64) REFERENCES DOCTORS(DOCTOR_ID),
    PATIENT_NAME       VARCHAR2(128) NOT NULL,
    PATIENT_PHONE      VARCHAR2(20),
    DOCTOR_NAME        VARCHAR2(128) NOT NULL,
    DOCTOR_SPECIALTY   VARCHAR2(64) NOT NULL,
    APPOINTMENT_DATE   VARCHAR2(16) NOT NULL,
    SLOT_TIME          VARCHAR2(16) NOT NULL,
    SYMPTOMS           VARCHAR2(1024),
    STATUS             VARCHAR2(20) DEFAULT 'confirmed' CHECK (STATUS IN ('confirmed', 'in-progress', 'completed', 'cancelled')),
    MEETING_ROOM_ID    VARCHAR2(128) NOT NULL UNIQUE,
    TOTAL_AMOUNT       NUMBER(8, 2) NOT NULL,
    PAYMENT_ID         VARCHAR2(128),
    ORDER_ID           VARCHAR2(128),
    CREATED_AT         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT UQ_DOCTOR_SLOT UNIQUE (DOCTOR_ID, APPOINTMENT_DATE, SLOT_TIME)
);

-- -----------------------------------------------------------------------------
-- 4. Table: PRESCRIPTIONS (Digital e-Prescription & ABDM QR Seal)
-- -----------------------------------------------------------------------------
CREATE TABLE PRESCRIPTIONS (
    PRESCRIPTION_ID    VARCHAR2(64) PRIMARY KEY,
    APPOINTMENT_ID     VARCHAR2(64) REFERENCES APPOINTMENTS(APPOINTMENT_ID) ON DELETE CASCADE,
    DOCTOR_ID          VARCHAR2(64) REFERENCES DOCTORS(DOCTOR_ID),
    PATIENT_NAME       VARCHAR2(128) NOT NULL,
    DIAGNOSIS          VARCHAR2(512) NOT NULL,
    MEDICINES_JSON     CLOB NOT NULL,
    ADVICE             VARCHAR2(1024),
    CRYPTO_SEAL        VARCHAR2(128) NOT NULL,
    VERIFICATION_URL   VARCHAR2(256),
    CREATED_AT         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 5. Table: PAYMENTS (Razorpay Transactions & Invoices)
-- -----------------------------------------------------------------------------
CREATE TABLE PAYMENTS (
    PAYMENT_ID         VARCHAR2(128) PRIMARY KEY,
    APPOINTMENT_ID     VARCHAR2(64) REFERENCES APPOINTMENTS(APPOINTMENT_ID) ON DELETE CASCADE,
    ORDER_ID           VARCHAR2(128) NOT NULL,
    AMOUNT             NUMBER(8, 2) NOT NULL,
    CURRENCY           VARCHAR2(10) DEFAULT 'INR',
    STATUS             VARCHAR2(20) DEFAULT 'captured',
    PAYMENT_METHOD     VARCHAR2(32) DEFAULT 'razorpay_gateway',
    CREATED_AT         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 6. Table: NOTIFICATIONS (Simulated SMS & Email Logs)
-- -----------------------------------------------------------------------------
CREATE TABLE NOTIFICATIONS (
    NOTIFICATION_ID    VARCHAR2(64) PRIMARY KEY,
    USER_ID            VARCHAR2(64) REFERENCES USERS(USER_ID) ON DELETE CASCADE,
    RECIPIENT          VARCHAR2(128) NOT NULL,
    TYPE               VARCHAR2(32) DEFAULT 'sms_and_email',
    MESSAGE            VARCHAR2(1024) NOT NULL,
    SENT_AT            TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- Pre-Seeded Indian Healthcare Verified Specialists
-- =============================================================================
INSERT INTO USERS (USER_ID, EMAIL, PASSWORD_HASH, FULL_NAME, ROLE, PHONE)
VALUES ('usr-doc-101', 'doctor@careconnect.com', '$2a$10$wE0vP6y2D7bC1w9X0y1ZZeO9Gq1Xf2s3d4e5f6a7b8c9d0e1f2a3b4', 'Dr. Ramesh Chandra Gupta', 'doctor', '+91 98111 22334');

INSERT INTO USERS (USER_ID, EMAIL, PASSWORD_HASH, FULL_NAME, ROLE, PHONE, BLOOD_GROUP)
VALUES ('usr-pat-001', 'patient@careconnect.com', '$2a$10$wE0vP6y2D7bC1w9X0y1ZZeO9Gq1Xf2s3d4e5f6a7b8c9d0e1f2a3b4', 'Rahul Sharma', 'patient', '+91 98765 43210', 'O+');

INSERT INTO DOCTORS (DOCTOR_ID, USER_ID, FULL_NAME, SPECIALTY, DEGREE, EXPERIENCE_YEARS, CLINIC, CONSULTATION_FEE, LICENSE_NUMBER, RATING, PHOTO_URL, AVAILABLE_SLOTS)
VALUES ('doc-in-101', 'usr-doc-101', 'Dr. Ramesh Chandra Gupta', 'General Physician', 'MBBS, MD - General Medicine (Gold Medalist)', 18, 'Fortis Escorts Hospital, New Delhi', 500.00, 'MCI-42918', 4.9, 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&auto=format&fit=crop&q=80', '09:00 AM, 11:30 AM, 02:00 PM, 04:30 PM, 06:00 PM');

INSERT INTO DOCTORS (DOCTOR_ID, USER_ID, FULL_NAME, SPECIALTY, DEGREE, EXPERIENCE_YEARS, CLINIC, CONSULTATION_FEE, LICENSE_NUMBER, RATING, PHOTO_URL, AVAILABLE_SLOTS)
VALUES ('doc-in-102', 'usr-doc-101', 'Dr. Priya S. Sharma', 'Cardiologist', 'MBBS, MD (Medicine), DM (Cardiology) - AIIMS New Delhi', 14, 'Max Super Speciality Hospital, Saket', 800.00, 'MCI-55219', 4.9, 'https://images.unsplash.com/photo-1664575602554-2087b04935a5?w=400&auto=format&fit=crop&q=80', '10:00 AM, 12:00 PM, 03:30 PM, 05:15 PM');

COMMIT;
