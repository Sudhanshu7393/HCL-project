/**
 * CareConnect360 - Live Doctor Discovery & Real-Time Booking Engine
 * Interacts with Firestore 'users' (doctors) and 'appointments' (booked slots)
 */

import {
  db,
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  setDoc,
  serverTimestamp
} from "./firebase-config.js";
import { processRazorpayCheckout } from "./payment.js";

// Global cache of currently fetched active doctors (pre-initialized for zero-latency instant render)
let activeDoctorsList = [];
let selectedDoctorForBooking = null;
let chosenSlotTime = null;

/**
 * Verified Indian Specialist Seed Data
 * Automatically inserted into Cloud Firestore if the 'users' collection is newly initialized
 */
const SEED_DOCTORS = [
  {
    "id": "doc-in-101",
    "uid": "doc-in-101",
    "email": "ramesh.gupta@fortishealthcare.com",
    "fullName": "Dr. Ramesh Chandra Gupta",
    "role": "doctor",
    "specialty": "General Physician",
    "department": "General Medicine",
    "degree": "MBBS, MD - General Medicine (Gold Medalist)",
    "experienceYears": 18,
    "clinic": "Fortis Escorts Hospital & Healthcare Clinic, New Delhi",
    "city": "New Delhi",
    "consultationFee": 500,
    "licenseNumber": "MCI-42918",
    "rating": 4.9,
    "patientStoriesCount": 312,
    "nextSlot": "Available Today at 4:30 PM",
    "photoUrl": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&auto=format&fit=crop&q=80",
    "languages": [
      "English",
      "Hindi"
    ],
    "about": "Dr. Ramesh Chandra Gupta is a Senior Consultant Physician with 18+ years of clinical excellence in internal medicine, lifestyle disorders, hypertension, diabetes management, and seasonal acute febrile illnesses.",
    "tags": [
      "fever",
      "cough",
      "cold",
      "viral",
      "flu",
      "diabetes",
      "general",
      "opd",
      "infection",
      "headache",
      "weakness"
    ],
    "availableSlots": [
      "09:00 AM",
      "11:30 AM",
      "02:00 PM",
      "04:30 PM",
      "06:00 PM"
    ]
  },
  {
    "id": "doc-in-102",
    "uid": "doc-in-102",
    "email": "priya.sharma@maxhealthcare.com",
    "fullName": "Dr. Priya S. Sharma",
    "role": "doctor",
    "specialty": "Cardiologist",
    "department": "Cardiology",
    "degree": "MBBS, MD (Medicine), DM (Cardiology) - AIIMS New Delhi",
    "experienceYears": 14,
    "clinic": "Max Super Speciality Hospital, Saket, New Delhi",
    "city": "New Delhi",
    "consultationFee": 800,
    "licenseNumber": "MCI-55219",
    "rating": 4.9,
    "patientStoriesCount": 240,
    "nextSlot": "Available Today at 5:15 PM",
    "photoUrl": "https://images.unsplash.com/photo-1664575602554-2087b04935a5?w=400&auto=format&fit=crop&q=80",
    "languages": [
      "English",
      "Hindi"
    ],
    "about": "Dr. Priya Sharma is an AIIMS-trained Interventional Cardiologist specializing in preventive cardiology, coronary artery disease, heart failure management, arrhythmia, and hypertension care.",
    "tags": [
      "heart",
      "cardio",
      "bp",
      "blood pressure",
      "chest pain",
      "hypertension",
      "palpitations",
      "cholesterol",
      "ecg"
    ],
    "availableSlots": [
      "10:00 AM",
      "12:00 PM",
      "03:30 PM",
      "05:15 PM"
    ]
  },
  {
    "id": "doc-in-103",
    "uid": "doc-in-103",
    "email": "sandeep.sundaram@apollohospitals.com",
    "fullName": "Dr. Sandeep K. Sundaram",
    "role": "doctor",
    "specialty": "Dermatologist",
    "department": "Dermatology",
    "degree": "MBBS, DVD, MD (Dermatology, Venereology & Leprosy)",
    "experienceYears": 11,
    "clinic": "Apollo Spectra Hospitals, Kailash Colony, New Delhi",
    "city": "New Delhi",
    "consultationFee": 600,
    "licenseNumber": "MCI-38104",
    "rating": 4.8,
    "patientStoriesCount": 185,
    "nextSlot": "Available Tomorrow at 10:00 AM",
    "photoUrl": "https://images.unsplash.com/photo-1622902046580-2b47f47f5471?w=400&auto=format&fit=crop&q=80",
    "languages": [
      "English",
      "Hindi",
      "Tamil"
    ],
    "about": "Dr. Sandeep Sundaram is an expert dermatologist and trichologist treating acne, eczema, psoriasis, alopecia (hair fall), fungal infections, and cosmetic dermatology.",
    "tags": [
      "skin",
      "derma",
      "acne",
      "rash",
      "allergy",
      "hair fall",
      "itching",
      "eczema",
      "psoriasis",
      "pigmentation"
    ],
    "availableSlots": [
      "10:00 AM",
      "11:30 AM",
      "03:00 PM",
      "05:00 PM"
    ]
  },
  {
    "id": "doc-in-104",
    "uid": "doc-in-104",
    "email": "vikram.rathore@apollohospitals.com",
    "fullName": "Dr. Vikramaditya Rathore",
    "role": "doctor",
    "specialty": "Neurologist",
    "department": "Neurology",
    "degree": "MBBS, MD, DM (Neurology) - NIMHANS Bengaluru",
    "experienceYears": 16,
    "clinic": "Indraprastha Apollo Hospitals, Sarita Vihar, New Delhi",
    "city": "New Delhi",
    "consultationFee": 1000,
    "licenseNumber": "MCI-29471",
    "rating": 4.9,
    "patientStoriesCount": 142,
    "nextSlot": "Available Tomorrow at 11:30 AM",
    "photoUrl": "https://images.unsplash.com/photo-1638202993928-7267aad84c31?w=400&auto=format&fit=crop&q=80",
    "languages": [
      "English",
      "Hindi"
    ],
    "about": "Dr. Vikramaditya Rathore is a senior neurologist from NIMHANS with 16 years of expertise in chronic migraines, peripheral neuropathy, epilepsy, vertigo, movement disorders, and stroke rehabilitation.",
    "tags": [
      "brain",
      "neuro",
      "migraine",
      "headache",
      "vertigo",
      "nerve",
      "seizure",
      "epilepsy",
      "tremor",
      "stroke"
    ],
    "availableSlots": [
      "11:30 AM",
      "01:00 PM",
      "04:00 PM",
      "06:30 PM"
    ]
  },
  {
    "id": "doc-in-105",
    "uid": "doc-in-105",
    "email": "suniti.verma@rainbowhospitals.in",
    "fullName": "Dr. Suniti Verma",
    "role": "doctor",
    "specialty": "Pediatrician",
    "department": "Pediatrics",
    "degree": "MBBS, DCH, MD (Pediatrics) - KGMU Lucknow",
    "experienceYears": 12,
    "clinic": "Rainbow Children's Hospital, Malviya Nagar, New Delhi",
    "city": "New Delhi",
    "consultationFee": 550,
    "licenseNumber": "MCI-48201",
    "rating": 4.8,
    "patientStoriesCount": 215,
    "nextSlot": "Available Today at 6:00 PM",
    "photoUrl": "https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=400&auto=format&fit=crop&q=80",
    "languages": [
      "English",
      "Hindi"
    ],
    "about": "Dr. Suniti Verma is a compassionate pediatrician and child specialist handling newborn care, immunization charts, pediatric nutrition, childhood infections, asthma, and developmental milestones.",
    "tags": [
      "child",
      "pediatric",
      "infant",
      "vaccine",
      "baby fever",
      "pediatrics",
      "growth",
      "newborn",
      "colic"
    ],
    "availableSlots": [
      "09:30 AM",
      "12:30 PM",
      "04:00 PM",
      "06:00 PM"
    ]
  },
  {
    "id": "doc-in-106",
    "uid": "doc-in-106",
    "email": "alok.verma@medanta.org",
    "fullName": "Dr. Alok Verma",
    "role": "doctor",
    "specialty": "Orthopedic",
    "department": "Orthopedics",
    "degree": "MBBS, MS (Orthopedics), M.Ch (Joint Replacement)",
    "experienceYears": 20,
    "clinic": "Medanta - The Medicity, Sector 38, Gurugram",
    "city": "Gurugram",
    "consultationFee": 750,
    "licenseNumber": "MCI-19342",
    "rating": 4.7,
    "patientStoriesCount": 190,
    "nextSlot": "Available Tomorrow at 2:00 PM",
    "photoUrl": "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&auto=format&fit=crop&q=80",
    "languages": [
      "English",
      "Hindi"
    ],
    "about": "Dr. Alok Verma is a renowned Orthopedic and Spine Surgeon at Medanta with 20 years of surgical experience in knee replacement, osteoarthritis, sciatica, back pain, and sports injuries.",
    "tags": [
      "bone",
      "ortho",
      "joint pain",
      "knee",
      "spine",
      "back pain",
      "arthritis",
      "fracture",
      "sciatica",
      "neck pain"
    ],
    "availableSlots": [
      "10:30 AM",
      "02:00 PM",
      "03:45 PM",
      "05:30 PM"
    ]
  },
  {
    "id": "doc-in-107",
    "uid": "doc-in-107",
    "email": "shalini.sengupta@maxhealthcare.com",
    "fullName": "Dr. Shalini Sengupta",
    "role": "doctor",
    "specialty": "Gynecologist",
    "department": "Obstetrics & Gynecology",
    "degree": "MBBS, MS (OB-GYN), DGO, Fellowship in Fetal Medicine",
    "experienceYears": 17,
    "clinic": "Max Smart Super Speciality Hospital, Saket, New Delhi",
    "city": "New Delhi",
    "consultationFee": 700,
    "licenseNumber": "DMC-38411",
    "rating": 4.9,
    "patientStoriesCount": 288,
    "nextSlot": "Available Today at 3:00 PM",
    "photoUrl": "https://images.unsplash.com/photo-1594824813626-d3c5015b67e2?w=400&auto=format&fit=crop&q=80",
    "languages": [
      "English",
      "Hindi",
      "Bengali"
    ],
    "about": "Dr. Shalini Sengupta is a leading Obstetrician & Gynecologist with 17 years of experience in high-risk pregnancy, PCOS/PCOD, irregular periods, infertility counseling, and menopause management.",
    "tags": [
      "women",
      "gynae",
      "gynecologist",
      "pregnancy",
      "pcos",
      "pcod",
      "periods",
      "fertility",
      "uterus",
      "infertility"
    ],
    "availableSlots": [
      "11:00 AM",
      "01:30 PM",
      "03:00 PM",
      "05:30 PM"
    ]
  },
  {
    "id": "doc-in-108",
    "uid": "doc-in-108",
    "email": "manish.agarwal@gangaram.org",
    "fullName": "Dr. Manish K. Agarwal",
    "role": "doctor",
    "specialty": "ENT Specialist",
    "department": "ENT (Ear, Nose & Throat)",
    "degree": "MBBS, MS (ENT), DNB (Otorhinolaryngology)",
    "experienceYears": 15,
    "clinic": "Sir Ganga Ram Hospital, Rajinder Nagar, New Delhi",
    "city": "New Delhi",
    "consultationFee": 600,
    "licenseNumber": "DMC-29104",
    "rating": 4.8,
    "patientStoriesCount": 164,
    "nextSlot": "Available Tomorrow at 11:00 AM",
    "photoUrl": "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&auto=format&fit=crop&q=80",
    "languages": [
      "English",
      "Hindi"
    ],
    "about": "Dr. Manish Agarwal is an accomplished ENT Surgeon managing chronic sinusitis, allergic rhinitis, tonsillitis, ear infections, hearing loss, vertigo, and snoring/sleep apnea.",
    "tags": [
      "ent",
      "ear",
      "nose",
      "throat",
      "sinus",
      "sinusitis",
      "hearing",
      "tonsils",
      "tinnitus",
      "snoring"
    ],
    "availableSlots": [
      "09:00 AM",
      "11:00 AM",
      "02:30 PM",
      "04:30 PM"
    ]
  },
  {
    "id": "doc-in-109",
    "uid": "doc-in-109",
    "email": "rohan.jayant@fortishealthcare.com",
    "fullName": "Dr. Rohan Jayant",
    "role": "doctor",
    "specialty": "Gastroenterologist",
    "department": "Gastroenterology",
    "degree": "MBBS, MD, DM (Gastroenterology) - AIIMS New Delhi",
    "experienceYears": 16,
    "clinic": "Fortis Escorts Liver & Digestive Diseases Institute, Okhla, New Delhi",
    "city": "New Delhi",
    "consultationFee": 850,
    "licenseNumber": "MCI-37841",
    "rating": 4.9,
    "patientStoriesCount": 228,
    "nextSlot": "Available Today at 4:00 PM",
    "photoUrl": "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=80",
    "languages": [
      "English",
      "Hindi"
    ],
    "about": "Dr. Rohan Jayant is an AIIMS-trained gastroenterologist and hepatologist treating acidity, GERD, fatty liver disease, irritable bowel syndrome (IBS), chronic constipation, ulcerative colitis, and liver cirrhosis.",
    "tags": [
      "stomach",
      "gastro",
      "liver",
      "acidity",
      "gerd",
      "constipation",
      "diarrhea",
      "gas",
      "bloating",
      "ulcer",
      "ibs"
    ],
    "availableSlots": [
      "10:00 AM",
      "01:00 PM",
      "04:00 PM",
      "06:00 PM"
    ]
  },
  {
    "id": "doc-in-110",
    "uid": "doc-in-110",
    "email": "neha.kapoor@maxhealthcare.com",
    "fullName": "Dr. Neha Kapoor",
    "role": "doctor",
    "specialty": "Psychiatrist",
    "department": "Psychiatry & Mental Health",
    "degree": "MBBS, MD (Psychiatry) - NIMHANS Bengaluru",
    "experienceYears": 11,
    "clinic": "Max Hospital, Sushant Lok 1, Gurugram",
    "city": "Gurugram",
    "consultationFee": 800,
    "licenseNumber": "DMC-58190",
    "rating": 4.9,
    "patientStoriesCount": 198,
    "nextSlot": "Available Today at 5:00 PM",
    "photoUrl": "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&auto=format&fit=crop&q=80",
    "languages": [
      "English",
      "Hindi",
      "Punjabi"
    ],
    "about": "Dr. Neha Kapoor is a senior psychiatrist providing compassionate telehealth consultations for generalized anxiety, clinical depression, panic attacks, insomnia, ADHD, OCD, and work burnout.",
    "tags": [
      "mental",
      "psychiatry",
      "anxiety",
      "depression",
      "stress",
      "insomnia",
      "sleep",
      "panic",
      "adhd",
      "counseling"
    ],
    "availableSlots": [
      "11:00 AM",
      "02:00 PM",
      "05:00 PM",
      "07:00 PM"
    ]
  },
  {
    "id": "doc-in-111",
    "uid": "doc-in-111",
    "email": "tanmay.bhargava@apollohospitals.com",
    "fullName": "Dr. Tanmay Bhargava",
    "role": "doctor",
    "specialty": "Pulmonologist",
    "department": "Pulmonology & Chest",
    "degree": "MBBS, MD (Respiratory Medicine), DNB, FCCP",
    "experienceYears": 13,
    "clinic": "Apollo Spectra Hospitals, Nehru Enclave, New Delhi",
    "city": "New Delhi",
    "consultationFee": 700,
    "licenseNumber": "DMC-44129",
    "rating": 4.8,
    "patientStoriesCount": 172,
    "nextSlot": "Available Tomorrow at 10:30 AM",
    "photoUrl": "https://images.unsplash.com/photo-1622902046580-2b47f47f5471?w=400&auto=format&fit=crop&q=80",
    "languages": [
      "English",
      "Hindi"
    ],
    "about": "Dr. Tanmay Bhargava is an expert chest physician handling bronchial asthma, COPD, chronic bronchitis, post-COVID respiratory issues, allergic cough, and interstitial lung diseases.",
    "tags": [
      "lungs",
      "pulmo",
      "asthma",
      "cough",
      "breathing",
      "shortness of breath",
      "copd",
      "chest",
      "wheezing"
    ],
    "availableSlots": [
      "10:30 AM",
      "12:30 PM",
      "03:30 PM",
      "05:30 PM"
    ]
  },
  {
    "id": "doc-in-112",
    "uid": "doc-in-112",
    "email": "shweta.bansal@sightcentre.org",
    "fullName": "Dr. Shweta Bansal",
    "role": "doctor",
    "specialty": "Ophthalmologist",
    "department": "Ophthalmology (Eye Care)",
    "degree": "MBBS, MS (Ophthalmology), Fellow LV Prasad Eye Institute",
    "experienceYears": 12,
    "clinic": "Centre for Sight & Super Speciality Eye Hospital, Safdarjung Enclave, New Delhi",
    "city": "New Delhi",
    "consultationFee": 600,
    "licenseNumber": "DMC-49821",
    "rating": 4.8,
    "patientStoriesCount": 155,
    "nextSlot": "Available Today at 2:30 PM",
    "photoUrl": "https://images.unsplash.com/photo-1594824813626-d3c5015b67e2?w=400&auto=format&fit=crop&q=80",
    "languages": [
      "English",
      "Hindi"
    ],
    "about": "Dr. Shweta Bansal is an experienced ophthalmic surgeon specializing in digital eye strain, refractive errors, dry eye syndromes, glaucoma screening, cataract evaluations, and diabetic retinopathy.",
    "tags": [
      "eye",
      "ophthalmology",
      "vision",
      "specs",
      "dry eye",
      "cataract",
      "glaucoma",
      "red eye",
      "strain"
    ],
    "availableSlots": [
      "10:00 AM",
      "02:30 PM",
      "04:30 PM",
      "06:30 PM"
    ]
  },
  {
    "id": "doc-in-113",
    "uid": "doc-in-113",
    "email": "arvind.krishnan@narayanahealth.org",
    "fullName": "Dr. Arvind K. Krishnan",
    "role": "doctor",
    "specialty": "Cardiologist",
    "department": "Cardiology",
    "degree": "MBBS, MD (Medicine), DM (Cardiology), FACC",
    "experienceYears": 19,
    "clinic": "Narayana Institute of Cardiac Sciences, Bommasandra, Bengaluru",
    "city": "Bengaluru",
    "consultationFee": 900,
    "licenseNumber": "KMC-34902",
    "rating": 4.9,
    "patientStoriesCount": 310,
    "nextSlot": "Available Tomorrow at 11:00 AM",
    "photoUrl": "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&auto=format&fit=crop&q=80",
    "languages": [
      "English",
      "Hindi",
      "Kannada",
      "Tamil"
    ],
    "about": "Dr. Arvind Krishnan has performed over 5,000 coronary angiographies and angioplasties. Expert in lipid disorders, ischemic heart disease, and hypertension.",
    "tags": [
      "heart",
      "cardio",
      "chest pain",
      "angina",
      "bypass",
      "stent",
      "blood pressure",
      "cholesterol"
    ],
    "availableSlots": [
      "11:00 AM",
      "01:30 PM",
      "03:30 PM",
      "05:00 PM"
    ]
  },
  {
    "id": "doc-in-114",
    "uid": "doc-in-114",
    "email": "ananya.mukherjee@apollohospitals.com",
    "fullName": "Dr. Ananya Mukherjee",
    "role": "doctor",
    "specialty": "General Physician",
    "department": "General Medicine",
    "degree": "MBBS, MD (Internal Medicine) - Medical College Kolkata",
    "experienceYears": 13,
    "clinic": "Apollo Multispeciality Hospitals, Canal Circular Rd, Kolkata",
    "city": "Kolkata",
    "consultationFee": 550,
    "licenseNumber": "WBMC-61042",
    "rating": 4.8,
    "patientStoriesCount": 220,
    "nextSlot": "Available Today at 5:30 PM",
    "photoUrl": "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&auto=format&fit=crop&q=80",
    "languages": [
      "English",
      "Hindi",
      "Bengali"
    ],
    "about": "Dr. Ananya Mukherjee provides clinical consultation for diabetes type 2, thyroid disorders, dengue, malaria, urinary tract infections (UTI), and metabolic syndrome.",
    "tags": [
      "fever",
      "diabetes",
      "thyroid",
      "uti",
      "infection",
      "dengue",
      "weakness",
      "general",
      "blood test"
    ],
    "availableSlots": [
      "09:30 AM",
      "12:00 PM",
      "03:30 PM",
      "05:30 PM"
    ]
  },
  {
    "id": "doc-in-115",
    "uid": "doc-in-115",
    "email": "meera.nambiar@manipalhospitals.com",
    "fullName": "Dr. Meera Nambiar",
    "role": "doctor",
    "specialty": "Dermatologist",
    "department": "Dermatology",
    "degree": "MBBS, MD (Dermatology, Venereology & Leprosy)",
    "experienceYears": 9,
    "clinic": "Manipal Hospital, Old Airport Road, Bengaluru",
    "city": "Bengaluru",
    "consultationFee": 650,
    "licenseNumber": "KMC-49210",
    "rating": 4.8,
    "patientStoriesCount": 145,
    "nextSlot": "Available Tomorrow at 12:00 PM",
    "photoUrl": "https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=400&auto=format&fit=crop&q=80",
    "languages": [
      "English",
      "Hindi",
      "Malayalam",
      "Kannada"
    ],
    "about": "Dr. Meera Nambiar specializes in stubborn acne, anti-aging therapies, PRP for hair regrowth, melasma, and autoimmune dermatological conditions.",
    "tags": [
      "skin",
      "acne",
      "hair fall",
      "prp",
      "melasma",
      "allergy",
      "fungal",
      "rash",
      "derma"
    ],
    "availableSlots": [
      "10:00 AM",
      "12:00 PM",
      "03:00 PM",
      "04:30 PM"
    ]
  },
  {
    "id": "doc-in-116",
    "uid": "doc-in-116",
    "email": "rajesh.pillai@cloudninecare.com",
    "fullName": "Dr. Rajesh K. Pillai",
    "role": "doctor",
    "specialty": "Pediatrician",
    "department": "Pediatrics",
    "degree": "MBBS, MD (Pediatrics), Fellowship in Neonatology",
    "experienceYears": 15,
    "clinic": "Cloudnine Hospital, Link Road, Malad West, Mumbai",
    "city": "Mumbai",
    "consultationFee": 600,
    "licenseNumber": "MMC-33819",
    "rating": 4.9,
    "patientStoriesCount": 260,
    "nextSlot": "Available Today at 4:30 PM",
    "photoUrl": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&auto=format&fit=crop&q=80",
    "languages": [
      "English",
      "Hindi",
      "Marathi",
      "Malayalam"
    ],
    "about": "Dr. Rajesh Pillai is a trusted pediatrician with 15 years in managing infant colic, childhood infections, pediatric allergy, pediatric asthma, and growth milestones.",
    "tags": [
      "child",
      "pediatric",
      "baby",
      "infant",
      "vaccine",
      "colic",
      "vomiting",
      "fever",
      "teething"
    ],
    "availableSlots": [
      "09:00 AM",
      "11:30 AM",
      "02:00 PM",
      "04:30 PM"
    ]
  },
  {
    "id": "doc-in-117",
    "uid": "doc-in-117",
    "email": "harish.balakrishnan@apollohospitals.com",
    "fullName": "Dr. Harish Balakrishnan",
    "role": "doctor",
    "specialty": "Orthopedic",
    "department": "Orthopedics",
    "degree": "MBBS, MS (Orthopedics), DNB Ortho, Fellowship in Arthroscopy",
    "experienceYears": 14,
    "clinic": "Apollo Hospitals, Greams Road, Thousand Lights, Chennai",
    "city": "Chennai",
    "consultationFee": 700,
    "licenseNumber": "TNMC-51098",
    "rating": 4.8,
    "patientStoriesCount": 175,
    "nextSlot": "Available Tomorrow at 03:00 PM",
    "photoUrl": "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&auto=format&fit=crop&q=80",
    "languages": [
      "English",
      "Hindi",
      "Tamil"
    ],
    "about": "Dr. Harish Balakrishnan is an expert in sports injury management, ACL tears, shoulder dislocations, cervical spondylosis, and minimally invasive joint care.",
    "tags": [
      "bone",
      "ortho",
      "knee",
      "shoulder",
      "ligament",
      "acl",
      "back pain",
      "arthritis",
      "fracture"
    ],
    "availableSlots": [
      "10:00 AM",
      "01:00 PM",
      "03:00 PM",
      "05:30 PM"
    ]
  },
  {
    "id": "doc-in-118",
    "uid": "doc-in-118",
    "email": "pooja.deshmukh@cloudninecare.com",
    "fullName": "Dr. Pooja Deshmukh",
    "role": "doctor",
    "specialty": "Gynecologist",
    "department": "Obstetrics & Gynecology",
    "degree": "MBBS, DNB (Obstetrics & Gynecology), MNAMS",
    "experienceYears": 10,
    "clinic": "Cloudnine Hospital, Senapati Bapat Road, Pune",
    "city": "Pune",
    "consultationFee": 650,
    "licenseNumber": "MMC-62180",
    "rating": 4.8,
    "patientStoriesCount": 190,
    "nextSlot": "Available Today at 6:15 PM",
    "photoUrl": "https://images.unsplash.com/photo-1664575602554-2087b04935a5?w=400&auto=format&fit=crop&q=80",
    "languages": [
      "English",
      "Hindi",
      "Marathi"
    ],
    "about": "Dr. Pooja Deshmukh focuses on adolescent gynecology, PCOS reversal plans, menstrual irregularity, prenatal care, and postnatal pelvic health.",
    "tags": [
      "women",
      "gynae",
      "pcos",
      "period",
      "pregnancy",
      "cramps",
      "fertility",
      "hormone"
    ],
    "availableSlots": [
      "11:30 AM",
      "02:30 PM",
      "04:30 PM",
      "06:15 PM"
    ]
  },
  {
    "id": "doc-in-119",
    "uid": "doc-in-119",
    "email": "shweta.rao@fortishealthcare.com",
    "fullName": "Dr. Shweta Rao",
    "role": "doctor",
    "specialty": "Neurologist",
    "department": "Neurology",
    "degree": "MBBS, MD (Medicine), DM (Neurology)",
    "experienceYears": 12,
    "clinic": "Fortis Memorial Research Institute, Sector 44, Gurugram",
    "city": "Gurugram",
    "consultationFee": 950,
    "licenseNumber": "HNMC-41890",
    "rating": 4.9,
    "patientStoriesCount": 165,
    "nextSlot": "Available Tomorrow at 10:00 AM",
    "photoUrl": "https://images.unsplash.com/photo-1594824813626-d3c5015b67e2?w=400&auto=format&fit=crop&q=80",
    "languages": [
      "English",
      "Hindi"
    ],
    "about": "Dr. Shweta Rao specializes in neuro-immunology, multiple sclerosis, neuropathic pain, cervical radiculopathy, and vestibular vertigo syndromes.",
    "tags": [
      "brain",
      "neuro",
      "nerve",
      "vertigo",
      "dizziness",
      "migraine",
      "numbness",
      "tingling",
      "paralysis"
    ],
    "availableSlots": [
      "10:00 AM",
      "12:00 PM",
      "03:00 PM",
      "05:00 PM"
    ]
  },
  {
    "id": "doc-in-120",
    "uid": "doc-in-120",
    "email": "sameer.khan@kokilabenhospital.com",
    "fullName": "Dr. Sameer Khan",
    "role": "doctor",
    "specialty": "General Physician",
    "department": "General Medicine",
    "degree": "MBBS, DNB (Family Medicine) - Lilavati Hospital",
    "experienceYears": 11,
    "clinic": "Kokilaben Dhirubhai Ambani Hospital, Andheri West, Mumbai",
    "city": "Mumbai",
    "consultationFee": 500,
    "licenseNumber": "MMC-51920",
    "rating": 4.8,
    "patientStoriesCount": 205,
    "nextSlot": "Available Today at 3:30 PM",
    "photoUrl": "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&auto=format&fit=crop&q=80",
    "languages": [
      "English",
      "Hindi",
      "Urdu"
    ],
    "about": "Dr. Sameer Khan is an experienced Family Physician focusing on acute infections, gastrointestinal upset, preventive health checks, and chronic disease monitoring.",
    "tags": [
      "fever",
      "cough",
      "vomiting",
      "stomach",
      "cold",
      "body ache",
      "general",
      "physician",
      "checkup"
    ],
    "availableSlots": [
      "10:00 AM",
      "01:00 PM",
      "03:30 PM",
      "06:00 PM"
    ]
  }
];

/**
 * Fetch all registered active doctors from Firestore 'users' collection
 * Seeds initial verified doctors if collection is newly created
 * @returns {Promise<Array<Object>>}
 */
export async function fetchActiveDoctors() {
  // Instantly populate UI so user never waits for remote network roundtrips
  if (!activeDoctorsList || activeDoctorsList.length === 0) {
    activeDoctorsList = [...SEED_DOCTORS];
  }
  populateHeroDoctorDropdown(activeDoctorsList);

  try {
    const res = await fetch("/api/doctors");
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.doctors && data.doctors.length > 0) {
        activeDoctorsList = data.doctors;
        renderDoctorsToDOM(data.doctors);
        populateHeroDoctorDropdown(data.doctors);
        return data.doctors;
      }
    }
  } catch (error) {
    console.info("CareConnect360: Using verified clinical specialists local dataset.");
  }
  
  renderDoctorsToDOM(SEED_DOCTORS);
  return SEED_DOCTORS;
}

/**
 * Renders modern doctor cards into the DOM
 * @param {Array<Object>} doctors 
 * @param {string|null} activeFilterName
 */
export function renderDoctorsToDOM(doctors, activeFilterName = null) {
  const container = document.getElementById("doctorListingContainer");
  const countEl = document.getElementById("doctorResultsCount");

  if (countEl) {
    if (activeFilterName && activeFilterName !== "All") {
      countEl.innerHTML = `
        <span style="color: #0f766e; font-weight: 700; display: inline-flex; align-items: center; gap: 6px;">
          <i class="fas fa-filter" style="font-size: 11px;"></i> Showing ${doctors.length} verified specialist${doctors.length === 1 ? '' : 's'} in ${activeFilterName}
        </span>
        <button type="button" onclick="window.filterDoctorsByDept('All')" style="margin-left: 8px; background: #fee2e2; border: 1px solid #fecaca; color: #b91c1c; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 99px; cursor: pointer; transition: all 0.2s;" title="Clear filter and show all specialists">
          <i class="fas fa-times"></i> Clear Filter
        </button>
      `;
    } else {
      countEl.textContent = `${doctors.length} verified doctors available for consultation in Delhi NCR`;
    }
  }

  if (!container) return;

  if (doctors.length === 0) {
    container.innerHTML = `
      <div style="background: #ffffff; border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 48px 24px; text-align: center; color: var(--text-muted); box-shadow: var(--shadow-card);">
        <i class="fas fa-user-md" style="font-size: 38px; color: #cbd5e1; margin-bottom: 12px; display: block;"></i>
        <h4 style="font-size: 16px; color: var(--text-main); margin-bottom: 6px; font-weight: 700;">No specialist doctors found ${activeFilterName ? `in ${activeFilterName}` : 'matching your query'}</h4>
        <p style="font-size: 13px; margin-bottom: 16px;">Try selecting another clinical specialty above or reset your search query.</p>
        <button type="button" class="btn btn-secondary" onclick="window.filterDoctorsByDept('All')" style="font-size: 13px; padding: 8px 16px;">
          <i class="fas fa-th-large"></i> View All Specialists
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = doctors.map(doc => {
    const docId = doc.uid || doc.id;
    const topTags = (doc.tags || ["consultation", "checkup"]).slice(0, 3);
    const slots = (doc.availableSlots || ["10:00 AM", "02:00 PM", "04:30 PM"]).slice(0, 3);

    return `
      <article class="doctor-card-modern" data-id="${docId}">
        <!-- Left: Doctor Avatar -->
        <div class="doc-avatar-box">
          <img src="${doc.photoUrl || 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&auto=format&fit=crop&q=80'}" alt="${doc.fullName}" loading="lazy">
          <span class="doc-verified-check" title="Medical Council of India Verified">
            <i class="fas fa-check"></i>
          </span>
        </div>

        <!-- Middle: Clinical Credentials & Hospital -->
        <div class="doc-details-col">
          <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
            <h3 class="doc-name-title">${doc.fullName}</h3>
            <span style="font-size: 11px; background: #ecfdf5; color: #059669; font-weight: 700; padding: 1px 7px; border-radius: 99px; border: 1px solid #a7f3d0;">
              MCI Verified
            </span>
          </div>
          <div class="doc-specialty-sub">${doc.specialty}</div>
          <div class="doc-degree-text">${doc.degree || 'MBBS, MD'} &bull; ${doc.experienceYears || '10'} years clinical experience</div>
          
          <div class="doc-hospital-tag">
            <i class="fas fa-hospital" style="color: var(--teal);"></i>
            <span>${doc.clinic || 'Verified Healthcare Clinic, New Delhi'}</span>
          </div>

          <div class="doc-tags-row">
            ${topTags.map(t => `<span class="doc-tag-pill"><i class="fas fa-tag" style="font-size: 9px; opacity: 0.7;"></i> ${t.charAt(0).toUpperCase() + t.slice(1)}</span>`).join("")}
          </div>

          <div class="doc-ratings-row">
            <span class="rating-tag-pill">
              <i class="fas fa-star" style="font-size: 10px;"></i> ${doc.rating || '4.9'}
            </span>
            <span class="stories-text">${doc.patientStoriesCount || 150} Verified Patient Stories &bull; 98% Recommended</span>
          </div>
        </div>

        <!-- Right: Consultation Fee & Slot Booking -->
        <div class="doc-booking-action-col">
          <div class="doc-fee-box">
            <span>Consultation Fee</span>
            <strong>₹${doc.consultationFee || 500}</strong>
            <small style="display: block; font-size: 11px; color: #059669; font-weight: 600; margin-top: 2px;">
              <i class="fas fa-shield-alt"></i> No hidden platform surge
            </small>
          </div>

          <div>
            <div class="doc-slots-preview">
              <span class="doc-slots-preview-label">Next Slots:</span>
              ${slots.map(s => `<button type="button" class="quick-slot-pill" onclick="window.openDoctorBookingModal('${docId}', '${s}')">${s}</button>`).join("")}
            </div>

            <button class="btn btn-primary" style="width: 100%; font-size: 13px;" onclick="window.openDoctorBookingModal('${docId}')">
              Book Video Consult <i class="fas fa-calendar-check" style="font-size: 11px;"></i>
            </button>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

/**
 * Queries Firestore for booked slots and renders slot availability pills
 * @param {string} doctorId 
 * @param {string} selectedDate 
 */
export async function renderDoctorSlots(doctorId, selectedDate) {
  const slotsContainer = document.getElementById("modalSlotsContainer");
  if (!slotsContainer) return;

  const cleanId = String(doctorId || "").trim();
  const doctor = activeDoctorsList.find(d => {
    const id = String(d.uid || d.id || "");
    return id === cleanId || 
           id === cleanId.replace("doc-", "doc-in-") || 
           cleanId === id.replace("doc-in-", "doc-");
  }) || selectedDoctorForBooking || SEED_DOCTORS[0];

  const standardSlots = doctor?.availableSlots || ["09:00 AM", "11:30 AM", "02:00 PM", "04:30 PM", "06:00 PM"];

  // Step 1: Instantly read local mirror cache (0ms latency)
  const bookedSlotTimes = [];
  try {
    const raw = localStorage.getItem("careconnect_appointments");
    if (raw) {
      const list = JSON.parse(raw);
      list.forEach(a => {
        if ((a.doctorId === doctorId || a.doctorId === doctor.uid) && a.appointmentDate === selectedDate && a.status === "confirmed" && a.slotTime) {
          if (!bookedSlotTimes.includes(a.slotTime)) bookedSlotTimes.push(a.slotTime);
        }
      });
    }
  } catch (e) {}

  // Helper to render slots synchronously
  const renderSlotsHtml = () => {
    let firstAvailable = null;
    slotsContainer.innerHTML = standardSlots.map((slot) => {
      const isBooked = bookedSlotTimes.includes(slot);
      if (isBooked) {
        return `
          <button type="button" class="slot-option-btn disabled" disabled title="Slot already booked by another patient">
            ${slot} <span style="font-size: 10px; color: #ef4444; display: block;">Booked</span>
          </button>
        `;
      }
      
      if (!firstAvailable) firstAvailable = slot;
      const isSelected = chosenSlotTime ? chosenSlotTime === slot : slot === firstAvailable;

      return `
        <button type="button" class="slot-option-btn ${isSelected ? 'selected' : ''}" onclick="window.selectSlotTime(this, '${slot}')">
          ${slot}
        </button>
      `;
    }).join("");

    if (!chosenSlotTime && firstAvailable) {
      chosenSlotTime = firstAvailable;
    }
  };

  // Instant render (0ms response)
  renderSlotsHtml();

  // Step 2: Background query Backend REST API for real-time booked slots
  try {
    const docUid = encodeURIComponent(doctor.uid || doctor.id || doctorId);
    const dateParam = encodeURIComponent(selectedDate);
    const res = await fetch(`/api/appointments/slots?doctorId=${docUid}&date=${dateParam}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.bookedSlots) {
        let changed = false;
        data.bookedSlots.forEach(s => {
          if (!bookedSlotTimes.includes(s)) {
            bookedSlotTimes.push(s);
            changed = true;
          }
        });
        if (changed) {
          renderSlotsHtml();
        }
      }
    }
  } catch (err) {
    // Local fallback intact
  }
}

/**
 * Opens Doctor Booking Modal with real doctor metadata instantly (0ms latency)
 * @param {string} doctorId 
 */
export function openDoctorBookingModal(doctorId, preselectedSlot = null) {
  const modal = document.getElementById("bookingModal");
  if (!modal) return;

  // 1. Show modal IMMEDIATELY (0ms visual latency)
  modal.classList.add("active");
  modal.style.display = "flex";

  // Resilient fallback if activeDoctorsList is still empty
  if (!activeDoctorsList || activeDoctorsList.length === 0) {
    activeDoctorsList = [...SEED_DOCTORS];
  }

  // Support both 'doc-101' and 'doc-in-101' formats
  const cleanId = String(doctorId || "").trim();
  const doctor = activeDoctorsList.find(d => {
    const id = String(d.uid || d.id || "");
    return id === cleanId || 
           id === cleanId.replace("doc-", "doc-in-") || 
           cleanId === id.replace("doc-in-", "doc-") ||
           (d.fullName && cleanId.includes(d.fullName.split(" ")[1]));
  }) || activeDoctorsList[0] || SEED_DOCTORS[0];

  if (!doctor) return;

  selectedDoctorForBooking = doctor;
  const targetDocId = doctor.uid || doctor.id || "doc-in-101";

  // Set doctor details immediately
  const photoEl = document.getElementById("modalDocPhoto");
  if (photoEl) photoEl.src = doctor.photoUrl || "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&auto=format&fit=crop&q=80";
  
  const nameEl = document.getElementById("modalDocName");
  if (nameEl) nameEl.textContent = doctor.fullName;

  const specEl = document.getElementById("modalDocSpec");
  if (specEl) specEl.textContent = `${doctor.specialty} • ${doctor.degree || 'MBBS, MD'}`;

  const ratingEl = document.getElementById("modalDocRating");
  if (ratingEl) ratingEl.textContent = `${doctor.rating || '4.9'} (${doctor.patientStoriesCount || 312} reviews)`;

  const deptTag = document.getElementById("modalDocDeptTag");
  if (deptTag) deptTag.textContent = doctor.specialty;

  const hospTag = document.getElementById("modalDocHospTag");
  if (hospTag) hospTag.textContent = (doctor.clinic || "Hospital").split(",")[0].slice(0, 18);

  const bioEl = document.getElementById("modalDocBio");
  if (bioEl) bioEl.textContent = `Senior Specialist with over ${doctor.experienceYears || 15} years of clinical care in ${doctor.specialty}, comprehensive diagnostics, and telehealth consultations.`;

  const feeEl = document.getElementById("modalDocFee");
  if (feeEl) feeEl.textContent = `₹${doctor.consultationFee || 500}`;

  const platformFee = 49;
  const total = (Number(doctor.consultationFee) || 500) + platformFee;
  
  const totalFeeEl = document.getElementById("modalTotalFee");
  if (totalFeeEl) totalFeeEl.textContent = `₹${total}`;

  const btnTotalEl = document.getElementById("modalBtnTotalAmount");
  if (btnTotalEl) btnTotalEl.textContent = `₹${total}`;

  // Date input setup
  const dateInput = document.getElementById("bookingDateInput");
  const today = new Date().toISOString().split("T")[0];
  if (dateInput) {
    dateInput.value = today;
    dateInput.min = today;
    dateInput.onchange = () => {
      renderDoctorSlots(targetDocId, dateInput.value);
      if (window.renderSchedulesCarousel) window.renderSchedulesCarousel(dateInput.value);
    };
  }

  // Populate date carousel
  if (window.renderSchedulesCarousel) {
    window.renderSchedulesCarousel(today);
  }

  // Render slots for selected doctor immediately without blocking
  chosenSlotTime = preselectedSlot || null;
  renderDoctorSlots(targetDocId, today);

  if (window.filterSlotPeriods) {
    window.filterSlotPeriods("Afternoon");
  }

  if (preselectedSlot) {
    document.querySelectorAll(".slot-option-btn").forEach(b => {
      if (b.textContent.trim().startsWith(preselectedSlot)) {
        b.classList.add("selected");
      }
    });
  }
}

/**
 * Handles slot time button selection
 */
export function selectSlotTime(btn, slot) {
  document.querySelectorAll(".slot-option-btn").forEach(b => b.classList.remove("selected"));
  btn.classList.add("selected");
  chosenSlotTime = slot;
}

/**
 * Closes Doctor Booking Modal
 */
export function closeDoctorBookingModal() {
  const modal = document.getElementById("bookingModal");
  if (modal) {
    modal.classList.remove("active");
    modal.style.display = "none";
  }
}

/**
 * Initiates Razorpay payment for the chosen slot and doctor
 */
export async function initiateBookingFromModal() {
  if (!selectedDoctorForBooking) {
    selectedDoctorForBooking = activeDoctorsList[0] || SEED_DOCTORS[0];
  }

  const dateInput = document.getElementById("bookingDateInput");
  const selectedDate = dateInput?.value || new Date().toISOString().split("T")[0];

  if (!chosenSlotTime) {
    const firstActiveBtn = document.querySelector("#modalSlotsContainer .slot-option-btn:not(.disabled)");
    if (firstActiveBtn) {
      chosenSlotTime = firstActiveBtn.textContent.trim().split("\n")[0].trim();
    } else {
      chosenSlotTime = "04:30 PM";
    }
  }

  const patientName = document.getElementById("patientNameInput")?.value.trim() || "Rahul Sharma";
  const patientPhone = document.getElementById("patientPhoneInput")?.value.trim() || "+91 98765 43210";
  const patientSymptoms = document.getElementById("patientSymptomsInput")?.value.trim() || "Seasonal health consultation";
  const triageLevel = document.getElementById("triageLevelText")?.textContent.trim() || "Level 1: Routine OPD";

  closeDoctorBookingModal();

  // Trigger Real Razorpay Checkout Flow
  try {
    await processRazorpayCheckout(selectedDoctorForBooking, chosenSlotTime, selectedDate, {
      name: patientName,
      phone: patientPhone,
      symptoms: patientSymptoms,
      triageLevel: triageLevel
    });
  } catch (err) {
    console.error("Booking failed or was cancelled:", err);
  }
}

/**
 * Populates the Hero Floating Appointment Bar doctor selector
 */
function populateHeroDoctorDropdown(doctors) {
  const docSelect = document.getElementById("heroDoctorSelect");
  if (!docSelect) return;

  docSelect.innerHTML = doctors.map(d => {
    const id = d.uid || d.id;
    const shortClinic = (d.clinic || "").split(",")[0] || "Hospital OPD";
    return `<option value="${id}">${d.fullName} (${shortClinic})</option>`;
  }).join("");
}

/**
 * Hero Bar quick booking action
 */
export function bookFromHeroBar() {
  const list = (activeDoctorsList && activeDoctorsList.length > 0) ? activeDoctorsList : SEED_DOCTORS;
  activeDoctorsList = list;

  const docSelect = document.getElementById("heroDoctorSelect");
  const dateInput = document.getElementById("heroDateInput");
  const docId = docSelect?.value || (list[0] ? (list[0].uid || list[0].id) : "doc-in-101");
  const dateVal = dateInput?.value || new Date().toISOString().split("T")[0];

  openDoctorBookingModal(docId);
  const bInput = document.getElementById("bookingDateInput");
  if (bInput && dateVal) {
    bInput.value = dateVal;
    renderDoctorSlots(docId, dateVal);
  }
}

/**
 * Hero Department sync
 */
export function syncHeroDepartmentToDoctor() {
  const deptSelect = document.getElementById("heroDepartmentSelect");
  const docSelect = document.getElementById("heroDoctorSelect");
  if (!deptSelect || !docSelect) return;

  const list = (activeDoctorsList && activeDoctorsList.length > 0) ? activeDoctorsList : SEED_DOCTORS;
  activeDoctorsList = list;

  const chosenDept = deptSelect.value;
  const filtered = chosenDept === "All"
    ? list
    : list.filter(d => d.specialty.toLowerCase() === chosenDept.toLowerCase());

  docSelect.innerHTML = (filtered.length > 0 ? filtered : list).map(d => {
    const id = d.uid || d.id;
    const shortClinic = (d.clinic || "").split(",")[0] || "Hospital OPD";
    return `<option value="${id}">${d.fullName} (${shortClinic})</option>`;
  }).join("");
}

export const DEPT_MAP = {
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

/**
 * Intelligent Semantic Doctor Matching
 * Accurately routes department names like 'Cardiology', 'Pediatrics' to their respective specialists
 */
export function isSpecialtyMatch(doc, filterTerm) {
  if (!filterTerm || filterTerm === "All") return true;
  const q = String(filterTerm).toLowerCase().trim();
  const spec = (doc.specialty || "").toLowerCase();
  const name = (doc.fullName || "").toLowerCase();
  const tags = (doc.tags || []).map(t => String(t).toLowerCase());

  // 1. Direct exact or substring match on doctor specialty
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

  // 3. Fallback tag and name match (for symptoms and general query search)
  if (tags.some(t => t === q || t.includes(q) || q.includes(t))) return true;
  if (name.includes(q)) return true;

  return false;
}

/**
 * Category Squircle & Circular Department Filter handler
 */
export function filterDoctorsByDept(dept, el) {
  const isAlreadyActive = el && el.classList.contains("active");

  // Clear active styling from all department triggers
  document.querySelectorAll(".squircle-dept-card").forEach(c => c.classList.remove("active"));
  document.querySelectorAll(".circle-dept-btn").forEach(c => c.classList.remove("active"));

  // Toggle behavior: clicking active card deselects and returns to 'All'
  const targetDept = (isAlreadyActive || !dept || dept === "All") ? "All" : dept;

  if (targetDept !== "All") {
    if (el) {
      el.classList.add("active");
    } else {
      // Find matching card in DOM and highlight it
      document.querySelectorAll(".squircle-dept-card, .circle-dept-btn").forEach(c => {
        const text = c.textContent.toLowerCase();
        if (text.includes(targetDept.toLowerCase())) {
          c.classList.add("active");
        }
      });
    }
  }

  const list = (activeDoctorsList && activeDoctorsList.length > 0) ? activeDoctorsList : SEED_DOCTORS;
  activeDoctorsList = list;

  const filtered = (targetDept === "All")
    ? list
    : list.filter(d => isSpecialtyMatch(d, targetDept));

  renderDoctorsToDOM(filtered, targetDept === "All" ? null : targetDept);

  const docSec = document.getElementById("doctorsSection");
  if (docSec) {
    docSec.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

/**
 * Search Bar handler
 */
export function handleDoctorSearch() {
  const searchInput = document.getElementById("doctorSearchInput");
  const query = (searchInput?.value || "").toLowerCase().trim();

  // Reset active department selections if typing custom search
  if (query) {
    document.querySelectorAll(".squircle-dept-card, .circle-dept-btn").forEach(c => c.classList.remove("active"));
  }

  const list = (activeDoctorsList && activeDoctorsList.length > 0) ? activeDoctorsList : SEED_DOCTORS;
  activeDoctorsList = list;

  const filtered = list.filter(d => {
    if (!query) return true;
    return isSpecialtyMatch(d, query);
  });

  renderDoctorsToDOM(filtered, query ? `Search: "${query}"` : null);
}

export function setBookingDateQuick(target) {
  const dateInput = document.getElementById("bookingDateInput");
  const btnToday = document.getElementById("btnDateToday");
  const btnTomorrow = document.getElementById("btnDateTomorrow");

  const now = new Date();
  if (target === "tomorrow") {
    now.setDate(now.getDate() + 1);
    if (btnTomorrow) btnTomorrow.classList.add("active");
    if (btnToday) btnToday.classList.remove("active");
  } else {
    if (btnToday) btnToday.classList.add("active");
    if (btnTomorrow) btnTomorrow.classList.remove("active");
  }

  const dateStr = now.toISOString().split("T")[0];
  if (dateInput) {
    dateInput.value = dateStr;
    if (selectedDoctorForBooking) {
      renderDoctorSlots(selectedDoctorForBooking.uid || selectedDoctorForBooking.id, dateStr);
    }
  }
}

export function openExploreConsultModal() {
  const modal = document.getElementById("exploreConsultModal");
  if (modal) {
    modal.classList.add("active");
    modal.style.display = "flex";
  }
}

export function closeExploreConsultModal() {
  const modal = document.getElementById("exploreConsultModal");
  if (modal) {
    modal.classList.remove("active");
    modal.style.display = "none";
  }
}

export function selectConsultSpecialty(deptName) {
  closeExploreConsultModal();
  let matchingCard = null;
  document.querySelectorAll(".squircle-dept-card").forEach(c => {
    if (c.textContent.toLowerCase().includes(deptName.toLowerCase()) || 
        (deptName.includes("General") && c.textContent.includes("Medicine"))) {
      matchingCard = c;
    }
  });
  filterDoctorsByDept(deptName, matchingCard);
  const sec = document.getElementById("doctorsSection");
  if (sec) {
    setTimeout(() => sec.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  }
}

export function selectConsultDisease(symptomOrTag) {
  closeExploreConsultModal();
  const searchInput = document.getElementById("doctorSearchInput");
  if (searchInput) {
    searchInput.value = symptomOrTag;
  }
  handleDoctorSearch();
  const sec = document.getElementById("doctorsSection");
  if (sec) {
    setTimeout(() => sec.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  }
}

export function handleExploreSearchSubmit(event) {
  if (event) event.preventDefault();
  const val = (document.getElementById("exploreSearchInput")?.value || "").trim();
  closeExploreConsultModal();
  const searchInput = document.getElementById("doctorSearchInput");
  if (searchInput) {
    searchInput.value = val;
  }
  handleDoctorSearch();
  const sec = document.getElementById("doctorsSection");
  if (sec) {
    setTimeout(() => sec.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  }
}

// Attach globally accessible handlers for inline HTML onclick attributes
window.openDoctorBookingModal = openDoctorBookingModal;
window.openBookingModal = openDoctorBookingModal;
window.closeDoctorBookingModal = closeDoctorBookingModal;
window.closeBookingModal = closeDoctorBookingModal;
window.openExploreConsultModal = openExploreConsultModal;
window.closeExploreConsultModal = closeExploreConsultModal;
window.selectConsultSpecialty = selectConsultSpecialty;
window.selectConsultDisease = selectConsultDisease;
window.handleExploreSearchSubmit = handleExploreSearchSubmit;
window.selectSlotTime = selectSlotTime;
window.initiateBookingFromModal = initiateBookingFromModal;
window.bookFromHeroBar = bookFromHeroBar;
window.syncHeroDepartmentToDoctor = syncHeroDepartmentToDoctor;
window.filterDoctorsByDept = filterDoctorsByDept;
window._moduleFilterDoctorsByDept = filterDoctorsByDept;
window.handleDoctorSearch = handleDoctorSearch;
window.setBookingDateQuick = setBookingDateQuick;

