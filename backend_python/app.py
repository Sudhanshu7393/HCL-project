"""
CareConnect360: VirtualCare Telemedicine Platform
Project ID: P_013 | Track: Healthcare | Full Stack Development
Python Backend Service & Oracle/SQL Data Access Layer
"""

import json
import sqlite3
import os
import hashlib
import time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs

DB_FILE = os.path.join(os.path.dirname(__file__), '..', 'data', 'careconnect.db')

def init_sqlite_db():
    os.makedirs(os.path.dirname(DB_FILE), exist_ok=True)
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            full_name TEXT NOT NULL,
            role TEXT NOT NULL,
            phone TEXT,
            blood_group TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS doctors (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            full_name TEXT NOT NULL,
            specialty TEXT NOT NULL,
            degree TEXT NOT NULL,
            experience_years INTEGER,
            clinic TEXT,
            consultation_fee REAL,
            license_number TEXT UNIQUE,
            rating REAL,
            photo_url TEXT,
            available_slots TEXT
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS appointments (
            id TEXT PRIMARY KEY,
            patient_id TEXT,
            doctor_id TEXT,
            patient_name TEXT,
            patient_phone TEXT,
            doctor_name TEXT,
            doctor_specialty TEXT,
            appointment_date TEXT,
            slot_time TEXT,
            symptoms TEXT,
            status TEXT DEFAULT 'confirmed',
            meeting_room_id TEXT UNIQUE,
            total_amount REAL,
            payment_id TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(doctor_id, appointment_date, slot_time)
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS prescriptions (
            id TEXT PRIMARY KEY,
            appointment_id TEXT,
            doctor_name TEXT,
            patient_name TEXT,
            diagnosis TEXT,
            medicines_json TEXT,
            advice TEXT,
            crypto_seal TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Pre-seed demo users if empty
    c.execute('SELECT COUNT(*) FROM users')
    if c.fetchone()[0] == 0:
        c.execute('''
            INSERT INTO users (id, email, password_hash, full_name, role, phone)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', ('usr-pat-001', 'patient@careconnect.com', hashlib.sha256('patient123'.encode()).hexdigest(), 'Rahul Sharma', 'patient', '+91 98765 43210'))
        
        c.execute('''
            INSERT INTO users (id, email, password_hash, full_name, role, phone)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', ('usr-doc-101', 'doctor@careconnect.com', hashlib.sha256('doctor123'.encode()).hexdigest(), 'Dr. Ramesh Chandra Gupta', 'doctor', '+91 98111 22334'))
        
        c.execute('''
            INSERT INTO doctors (id, user_id, full_name, specialty, degree, experience_years, clinic, consultation_fee, license_number, rating, photo_url, available_slots)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', ('doc-in-101', 'usr-doc-101', 'Dr. Ramesh Chandra Gupta', 'General Physician', 'MBBS, MD - General Medicine', 18, 'Fortis Escorts Hospital, New Delhi', 500, 'MCI-42918', 4.9, 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&auto=format&fit=crop&q=80', '09:00 AM, 11:30 AM, 02:00 PM, 04:30 PM, 06:00 PM'))
        
        c.execute('''
            INSERT INTO doctors (id, user_id, full_name, specialty, degree, experience_years, clinic, consultation_fee, license_number, rating, photo_url, available_slots)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', ('doc-in-102', 'usr-doc-101', 'Dr. Priya S. Sharma', 'Cardiologist', 'MBBS, MD, DM (Cardiology) - AIIMS', 14, 'Max Super Speciality Hospital, Saket', 800, 'MCI-55219', 4.9, 'https://images.unsplash.com/photo-1664575602554-2087b04935a5?w=400&auto=format&fit=crop&q=80', '10:00 AM, 12:00 PM, 03:30 PM, 05:15 PM'))

    conn.commit()
    conn.close()

class PythonCareConnectHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PATCH')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def send_json(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

    def do_GET(self):
        parsed = urlparse(self.path)
        params = parse_qs(parsed.query)

        # 1. API Doctors
        if parsed.path == '/api/doctors':
            conn = sqlite3.connect(DB_FILE)
            conn.row_factory = sqlite3.Row
            c = conn.cursor()
            c.execute('SELECT * FROM doctors')
            rows = [dict(r) for r in c.fetchall()]
            conn.close()
            return self.send_json({'success': True, 'count': len(rows), 'doctors': rows})

        # 2. API Slots
        if parsed.path == '/api/appointments/slots':
            doc_id = params.get('doctorId', ['doc-in-101'])[0]
            date_val = params.get('date', [''])[0]
            conn = sqlite3.connect(DB_FILE)
            c = conn.cursor()
            c.execute('SELECT slot_time FROM appointments WHERE doctor_id=? AND appointment_date=?', (doc_id, date_val))
            booked = [r[0] for r in c.fetchall()]
            conn.close()
            return self.send_json({
                'success': True,
                'doctorId': doc_id,
                'date': date_val,
                'allSlots': ['09:00 AM', '11:30 AM', '02:00 PM', '04:30 PM', '06:00 PM'],
                'bookedSlots': booked
            })

        # 3. Video Token
        if parsed.path == '/api/video/token':
            room = params.get('room', ['careconnect-room'])[0]
            return self.send_json({
                'success': True,
                'channel': room,
                'token': f'agora_token_{room}_{int(time.time())}',
                'appId': '4a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d'
            })

        # Static file fallback
        super().do_GET()

if __name__ == '__main__':
    init_sqlite_db()
    port = 8000
    server = ThreadingHTTPServer(('0.0.0.0', port), PythonCareConnectHandler)
    print(f"P_013 Python/Django/SQL Backend Microservice active on port {port}")
    server.serve_forever()
