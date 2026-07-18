"""
Django settings for Escape the Lab — Prometheus Hackathon 2026.
"""

from pathlib import Path
from decouple import config, Csv
import dj_database_url

BASE_DIR = Path(__file__).resolve().parent.parent

# SECRET_KEY must be set in .env — no insecure fallback allowed.
SECRET_KEY = config('SECRET_KEY')
DEBUG = config('DEBUG', default=False, cast=bool)
ALLOWED_HOSTS = ['localhost', '127.0.0.1'] if DEBUG else config('ALLOWED_HOSTS', default='').split(',')

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third-party
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',
    'drf_spectacular',

    # Local
    'tracks.apps.TracksConfig',
    'accounts.apps.AccountsConfig',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',     # WhiteNoise must be right after SecurityMiddleware
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',          # must be before CommonMiddleware
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

# Database — use DATABASE_URL in production (Postgres), SQLite locally.
_database_url = config('DATABASE_URL', default='')
if _database_url:
    DATABASES = {'default': dj_database_url.parse(_database_url, conn_max_age=600)}
else:
    db_path = BASE_DIR / 'db.sqlite3' if DEBUG else Path('/app/data/db.sqlite3')
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': db_path,
        }
    }

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# WhiteNoise storage configuration
STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

# --- Media Storage (Local vs S3) ---
MEDIA_URL = '/media/'
# If in production, MEDIA_ROOT should point to the mounted /app/media volume
MEDIA_ROOT = BASE_DIR / 'media' if DEBUG else Path('/app/media')

# AWS S3 Settings (for media uploads)
# Credentials are optional — if omitted, boto3 uses the EC2 IAM instance role automatically.
# Only set these if you are NOT using an IAM role (e.g. local dev without a role).
_aws_key    = config('AWS_ACCESS_KEY_ID', default='')
_aws_secret = config('AWS_SECRET_ACCESS_KEY', default='')
if _aws_key:
    AWS_ACCESS_KEY_ID = _aws_key
if _aws_secret:
    AWS_SECRET_ACCESS_KEY = _aws_secret

AWS_STORAGE_BUCKET_NAME = config('AWS_STORAGE_BUCKET_NAME', default='')
AWS_S3_REGION_NAME      = config('AWS_S3_REGION_NAME', default='us-east-1')
AWS_LOCATION            = config('AWS_LOCATION', default='avatars')
AWS_S3_CUSTOM_DOMAIN    = f'{AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com'
AWS_S3_FILE_OVERWRITE   = False
AWS_DEFAULT_ACL         = 'public-read'
AWS_QUERYSTRING_AUTH    = False  # Avoid signed URLs — bucket is public-read

if AWS_STORAGE_BUCKET_NAME:
    # Use S3 for user-uploaded media
    STORAGES["default"] = {
        "BACKEND": "storages.backends.s3boto3.S3Boto3Storage",
    }
    MEDIA_URL = f'https://{AWS_S3_CUSTOM_DOMAIN}/{AWS_LOCATION}/' if AWS_LOCATION else f'https://{AWS_S3_CUSTOM_DOMAIN}/'

# --- CORS ---
# In .env set: CORS_ALLOWED_ORIGINS=https://yourdomain.com,http://localhost:5173
_cors_origins = config(
    'CORS_ALLOWED_ORIGINS',
    default='http://localhost:5173,http://127.0.0.1:5173',
    cast=Csv()
)
CORS_ALLOWED_ORIGINS = list(_cors_origins)
# Never allow all origins — always use the explicit whitelist above.
CORS_ALLOW_ALL_ORIGINS = False

# --- Django REST Framework ---
REST_FRAMEWORK = {
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    # Rate limiting: unauthenticated 20/min, authenticated 60/min
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '20/min',
        'user': '60/min',
    },
}

SPECTACULAR_SETTINGS = {
    'TITLE': 'QuestOps API',
    'DESCRIPTION': (
        'AI-powered immersive learning platform. Solve real cybersecurity incidents, '
        'software bugs, and cloud outages in isolated simulation environments.'
    ),
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    # Restrict schema download and Swagger/ReDoc UI to admin users only.
    'SERVE_PERMISSIONS': ['rest_framework.permissions.IsAdminUser'],
    'CONTACT': {'name': 'QuestOps Team'},
    'LICENSE': {'name': 'MIT'},
    'TAGS': [
        {'name': 'auth', 'description': 'User registration, login, and profile management'},
        {'name': 'tracks', 'description': 'Learning tracks and scenario catalog'},
        {'name': 'simulation', 'description': 'Stage submission and skill progression'},
        {'name': 'ai', 'description': 'AI-powered lesson chat and scenario generation'},
    ],
}

# --- Logging ---
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'WARNING',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'WARNING',
            'propagate': False,
        },
        'tracks': {
            'handlers': ['console'],
            'level': 'ERROR',
            'propagate': False,
        },
        'accounts': {
            'handlers': ['console'],
            'level': 'ERROR',
            'propagate': False,
        },
    },
}

# --- AI backends ---
# AI_MODE: 'online' → Groq cloud API  |  'offline' → Ollama local model
AI_MODE = config('AI_MODE', default='offline')

# Offline — Ollama
OLLAMA_BASE_URL = config('OLLAMA_BASE_URL', default='http://localhost:11434')
OLLAMA_MODEL = config('OLLAMA_MODEL', default='qwen2.5-coder:7b')

# Online — DeepSeek
DEEPSEEK_API_KEY = config('DEEPSEEK_API_KEY', default='')
DEEPSEEK_MODEL = config('DEEPSEEK_MODEL', default='deepseek-v4-flash')
DEEPSEEK_API_BASE_URL = config('DEEPSEEK_API_BASE_URL', default='https://api.deepseek.com')

# --- Production Security Headers ---
SECURE_SSL_REDIRECT = config('SECURE_SSL_REDIRECT', default=False, cast=bool)
SESSION_COOKIE_SECURE = config('SESSION_COOKIE_SECURE', default=False, cast=bool)
CSRF_COOKIE_SECURE = config('CSRF_COOKIE_SECURE', default=False, cast=bool)
SECURE_HSTS_SECONDS = config('SECURE_HSTS_SECONDS', default=0, cast=int)

