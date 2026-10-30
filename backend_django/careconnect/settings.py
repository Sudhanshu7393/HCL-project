"""
CareConnect360 - Django Project Settings
Project ID: P_013 | Track: Healthcare | Full Stack Development
Configured for Oracle DB / SQLite Fallback with Django REST Framework
"""

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'careconnect360-telemedicine-enterprise-secret-key-p013')

DEBUG = True

ALLOWED_HOSTS = ['*']

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third-party & Local Apps
    'telemedicine.apps.TelemedicineConfig',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'careconnect.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR.parent],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'careconnect.wsgi.application'

# ==============================================================================
# Database Configuration: Oracle DB (Enterprise) with SQLite Local Dev Fallback
# ==============================================================================
USE_ORACLE_DB = os.environ.get('USE_ORACLE_DB', 'False').lower() in ('true', '1')

if USE_ORACLE_DB:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.oracle',
            'NAME': os.environ.get('ORACLE_SID', 'ORCLCDB'),
            'USER': os.environ.get('ORACLE_USER', 'CARECONNECT_ADMIN'),
            'PASSWORD': os.environ.get('ORACLE_PASSWORD', 'SecureCare360Pass'),
            'HOST': os.environ.get('ORACLE_HOST', 'localhost'),
            'PORT': os.environ.get('ORACLE_PORT', '1521'),
        }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR.parent / 'data' / 'careconnect.db',
        }
    }

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', 'OPTIONS': {'min_length': 6}},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Kolkata'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATICFILES_DIRS = [BASE_DIR.parent]

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
