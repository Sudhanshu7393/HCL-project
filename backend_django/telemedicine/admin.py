from django.contrib import admin
from .models import UserProfile, Doctor, Appointment, Prescription, Payment, Notification

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user_id', 'full_name', 'email', 'role', 'phone', 'created_at')
    search_fields = ('full_name', 'email', 'phone')
    list_filter = ('role',)

@admin.register(Doctor)
class DoctorAdmin(admin.ModelAdmin):
    list_display = ('doctor_id', 'full_name', 'specialty', 'license_number', 'consultation_fee', 'rating', 'is_available')
    search_fields = ('full_name', 'specialty', 'license_number')
    list_filter = ('specialty', 'is_available')

@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ('appointment_id', 'patient_name', 'doctor_name', 'appointment_date', 'slot_time', 'status', 'amount')
    list_filter = ('status', 'appointment_date')
    search_fields = ('patient_name', 'doctor_name', 'appointment_id')

@admin.register(Prescription)
class PrescriptionAdmin(admin.ModelAdmin):
    list_display = ('prescription_id', 'appointment', 'diagnosis', 'created_at')

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('payment_id', 'razorpay_payment_id', 'amount', 'status', 'created_at')

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('notification_id', 'type', 'recipient', 'status', 'created_at')
