"""
Django settings for Smart Home Server.
"""

from pathlib import Path
import os
import dj_database_url
from dotenv import load_dotenv

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Load biến môi trường từ file .env (chỉ có tác dụng khi dev local)
load_dotenv()

# ================================================================
# SECURITY – Đọc từ biến môi trường (bắt buộc trên Render)
# ================================================================
SECRET_KEY = os.environ.get(
    'SECRET_KEY',
    'django-insecure-fallback-dev-key-change-in-production'
)

DEBUG = os.environ.get('DEBUG', 'False').lower() == 'true'

# Render cung cấp HOST qua biến RENDER_EXTERNAL_HOSTNAME
_RENDER_HOST = os.environ.get('RENDER_EXTERNAL_HOSTNAME', '')
ALLOWED_HOSTS = ['localhost', '127.0.0.1']
if _RENDER_HOST:
    ALLOWED_HOSTS.append(_RENDER_HOST)
# Nếu ALLOWED_HOSTS trong env là '*' thì cho qua tất cả (dev)
_ALLOWED_HOSTS_ENV = os.environ.get('ALLOWED_HOSTS', '')
if _ALLOWED_HOSTS_ENV == '*':
    ALLOWED_HOSTS = ['*']
elif _ALLOWED_HOSTS_ENV:
    ALLOWED_HOSTS += [h.strip() for h in _ALLOWED_HOSTS_ENV.split(',') if h.strip()]



# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'whitenoise.runserver_nostatic',  # Phải trước staticfiles
    'django.contrib.staticfiles',
    'django.contrib.postgres', 
    'rest_framework',
    'corsheaders',
    # Modular Monolith apps
    'core.users',
    'core.homes',
    'core.devices',
    'core.logs',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # Phục vụ static files trên Render
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'


# ================================================================
# DATABASE – Ưu tiên DATABASE_URL (Render/Supabase)
# ================================================================
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('DB_NAME', 'postgres'),
        'USER': os.getenv('DB_USER', 'postgres'),
        'PASSWORD': os.getenv('DB_PASSWORD', ''),
        'HOST': os.getenv('DB_HOST', 'localhost'),
        'PORT': os.getenv('DB_PORT', '5432'),
        'OPTIONS': {'sslmode': 'require'},
    }
}

_DATABASE_URL = os.environ.get('DATABASE_URL')
if _DATABASE_URL:
    DATABASES['default'] = dj_database_url.parse(
        _DATABASE_URL,
        conn_max_age=600,
        conn_health_checks=True,
    )
    # Supabase Pooler yêu cầu sslmode=require
    DATABASES['default'].setdefault('OPTIONS', {})
    DATABASES['default']['OPTIONS']['sslmode'] = 'require'

# Supabase Storage
SUPABASE_URL = os.getenv('SUPABASE_URL', '')
SUPABASE_ANON_KEY = os.getenv('SUPABASE_ANON_KEY', '')

# Password validation
# https://docs.djangoproject.com/en/5.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/5.2/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True


# ================================================================
# STATIC FILES – WhiteNoise phục vụ trên Render (không cần nginx)
# ================================================================
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ================================================================
# CORS – Cho phép mobile app và web gọi API
# ================================================================
CORS_ALLOW_ALL_ORIGINS = True

# ================================================================
# MQTT – Đọc từ biến môi trường (device_service.py tự xử lý)
# ================================================================
# MQTT_BROKER_HOST, MQTT_BROKER_PORT, MQTT_USERNAME, MQTT_PASSWORD
# được set trực tiếp trên Render Dashboard → Environment