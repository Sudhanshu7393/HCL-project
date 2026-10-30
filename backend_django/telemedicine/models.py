"""
CareConnect360: VirtualCare Telemedicine Platform
Project ID: P_013 | Track: Healthcare | Full Stack Development
Django ORM Models - Mapped 1:1 to Oracle Database Schema (backend/schema_oracle.sql)
"""

from django.db import models
from django.utils import timezone
import uuid

class UserProfile(models.Model):
    ROLE_CHOICES = (
        ('patient', 'Patient'),
        ('doctor', 'Doctor'),
        ('admin', 'Medical Administrator'),
    )
    user_id = models.CharField(max_length=64, primary_key=True, default=lambda: f"usr_{uuid.uuid4().hex[:12]}")
    email = models.EmailField(max_length=128, unique=True)
    password_hash = models.CharField(max_length=256)
    full_name = models.CharField(max_length=128)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='patient')
    phone = models.CharField(max_length=20, blank=True, null=True)
    blood_group = models.CharField(max_length=8, blank=True, null=True)
    allergies = models.CharField(max_length=256, default='None Reported')
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'USERS'
        verbose_name = 'User Profile'
        verbose_name_plural = 'User Profiles'

    def __str__(self):
        return f"{self.full_name} ({self.role}) - {self.email}"


class Doctor(models.Model):
    doctor_id = models.CharField(max_length=64, primary_key=True, default=lambda: f"doc_{uuid.uuid4().hex[:12]}")
    user = models.ForeignKey(UserProfile, on_delete=models.CASCADE, db_column='USER_ID', related_name='doctor_profile')
    full_name = models.CharField(max_length=128)
    specialty = models.CharField(max_length=64)
    degree = models.CharField(max_length=64, default='MBBS, MD')
    experience_years = models.IntegerField(default=5)
    clinic = models.CharField(max_length=256, default='Apollo / Fortis Telemedicine Center')
    consultation_fee = models.DecimalField(max_digits=10, decimal_places=2, default=500.00)
    license_number = models.CharField(max_length=64, unique=True)
    rating = models.DecimalField(max_digits=3, decimal_places=1, default=4.9)
    photo_url = models.CharField(max_length=512, blank=True, null=True)
    available_slots = models.TextField(help_text="JSON serialized array of available daily consultation slots")
    is_available = models.BooleanField(default=True)

    class Meta:
        db_table = 'DOCTORS'
        verbose_name = 'Doctor'
        verbose_name_plural = 'Doctors'

    def __str__(self):
        return f"Dr. {self.full_name} ({self.specialty}) [Reg: {self.license_number}]"


class Appointment(models.Model):
    STATUS_CHOICES = (
        ('confirmed', 'Confirmed'),
        ('in-progress', 'In-Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    )
    appointment_id = models.CharField(max_length=64, primary_key=True, default=lambda: f"apt_{uuid.uuid4().hex[:12]}")
    patient = models.ForeignKey(UserProfile, on_delete=models.CASCADE, db_column='PATIENT_ID', related_name='appointments_as_patient')
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, db_column='DOCTOR_ID', related_name='appointments_as_doctor')
    patient_name = models.CharField(max_length=128)
    patient_phone = models.CharField(max_length=20)
    doctor_name = models.CharField(max_length=128)
    doctor_specialty = models.CharField(max_length=64)
    appointment_date = models.DateField()
    slot_time = models.CharField(max_length=32)
    symptoms = models.TextField()
    triage_level = models.CharField(max_length=32, default='Level 1 (Routine)')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_status = models.CharField(max_length=20, default='paid')
    video_room_id = models.CharField(max_length=128)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='confirmed')
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'APPOINTMENTS'
        unique_together = ('doctor', 'appointment_date', 'slot_time')
        ordering = ['-appointment_date', '-slot_time']

    def __str__(self):
        return f"Appt #{self.appointment_id}: {self.patient_name} with {self.doctor_name} on {self.appointment_date} @ {self.slot_time}"


class Prescription(models.Model):
    prescription_id = models.CharField(max_length=64, primary_key=True, default=lambda: f"rx_{uuid.uuid4().hex[:12]}")
    appointment = models.OneToOneField(Appointment, on_delete=models.CASCADE, db_column='APPOINTMENT_ID', related_name='prescription')
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, db_column='DOCTOR_ID')
    patient = models.ForeignKey(UserProfile, on_delete=models.CASCADE, db_column='PATIENT_ID')
    diagnosis = models.TextField()
    vitals = models.JSONField(default=dict, blank=True, help_text="BP, Pulse, SpO2, Temperature")
    medicines = models.JSONField(default=list, help_text="Prescribed drug name, dosage, frequency, duration")
    advice = models.TextField(blank=True, null=True)
    digital_signature = models.CharField(max_length=256)
    qr_code_hash = models.CharField(max_length=128)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'PRESCRIPTIONS'
        verbose_name = 'Digital Prescription'
        verbose_name_plural = 'Digital Prescriptions'

    def __str__(self):
        return f"Rx #{self.prescription_id} for Appt {self.appointment_id}"


class Payment(models.Model):
    payment_id = models.CharField(max_length=64, primary_key=True, default=lambda: f"pay_{uuid.uuid4().hex[:12]}")
    appointment = models.ForeignKey(Appointment, on_delete=models.CASCADE, db_column='APPOINTMENT_ID')
    patient = models.ForeignKey(UserProfile, on_delete=models.CASCADE, db_column='PATIENT_ID')
    razorpay_order_id = models.CharField(max_length=128)
    razorpay_payment_id = models.CharField(max_length=128, unique=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=8, default='INR')
    status = models.CharField(max_length=20, default='captured')
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'PAYMENTS'

    def __str__(self):
        return f"Payment #{self.razorpay_payment_id} - Rs. {self.amount}"


class Notification(models.Model):
    notification_id = models.CharField(max_length=64, primary_key=True, default=lambda: f"notif_{uuid.uuid4().hex[:12]}")
    user = models.ForeignKey(UserProfile, on_delete=models.CASCADE, db_column='USER_ID')
    type = models.CharField(max_length=20, choices=(('sms', 'SMS'), ('email', 'Email'), ('push', 'Push Notification')))
    recipient = models.CharField(max_length=128)
    message = models.TextField()
    status = models.CharField(max_length=20, default='sent')
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = 'NOTIFICATIONS'

    def __str__(self):
        return f"[{self.type.upper()}] To: {self.recipient} ({self.status})"
