"""
CareConnect360 - Django REST Views & API Controllers
"""

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from .models import Doctor, Appointment, Prescription, Payment, Notification

def get_doctors_api(request):
    """GET /api/doctors - Fetch all active doctors with specialties"""
    specialty = request.GET.get('specialty')
    doctors = Doctor.objects.filter(is_available=True)
    if specialty and specialty.lower() != 'all':
        doctors = doctors.filter(specialty__icontains=specialty)
    
    data = []
    for d in doctors:
        slots = []
        try:
            slots = json.loads(d.available_slots) if isinstance(d.available_slots, str) else d.available_slots
        except:
            slots = ["09:00 AM", "10:30 AM", "02:00 PM", "04:30 PM"]
            
        data.append({
            'id': d.doctor_id,
            'name': f"Dr. {d.full_name}",
            'specialty': d.specialty,
            'degree': d.degree,
            'experience': f"{d.experience_years} years",
            'clinic': d.clinic,
            'consultationFee': float(d.consultation_fee),
            'licenseNumber': d.license_number,
            'rating': float(d.rating),
            'photo': d.photo_url or 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300',
            'availableSlots': slots
        })
    return JsonResponse({'success': True, 'count': len(data), 'doctors': data})

def get_slots_api(request):
    """GET /api/appointments/slots?doctorId=...&date=... - Returns booked slots"""
    doctor_id = request.GET.get('doctorId')
    date_str = request.GET.get('date')
    if not doctor_id or not date_str:
        return JsonResponse({'success': False, 'message': 'doctorId and date are required'}, status=400)
    
    booked = list(Appointment.objects.filter(
        doctor_id=doctor_id,
        appointment_date=date_str,
        status__in=['confirmed', 'in-progress']
    ).values_list('slot_time', flat=True))

    return JsonResponse({
        'success': True,
        'doctorId': doctor_id,
        'date': date_str,
        'bookedSlots': booked
    })

def health_check(request):
    """GET /api/health - Returns API health and P_013 project metadata"""
    return JsonResponse({
        'status': 'online',
        'framework': 'Django 5.x / Python 3.12',
        'database': 'Oracle Database (Enterprise ANSI SQL) / SQLite Fallback',
        'projectId': 'P_013',
        'projectTitle': 'CareConnect360: VirtualCare Telemedicine Platform',
        'synopsis': 'Telemedicine platform for virtual consultations, prescription management, secure video conferencing and billing.'
    })
