from django.urls import path
from . import views

urlpatterns = [
    path('health', views.health_check, name='health_check'),
    path('doctors', views.get_doctors_api, name='get_doctors'),
    path('appointments/slots', views.get_slots_api, name='get_slots'),
]
