"""
Django settings for server project.

Generated by 'django-admin startproject' using Django 2.2.

For more information on this file, see
https://docs.djangoproject.com/en/2.2/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/2.2/ref/settings/
"""

import json
import os
import environ

env = environ.Env()

root = environ.Path(__file__).path('../' * 3)

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/2.2/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'sh#(3i!zq392o_2(&snzd(dx5ubj2z+6(=a9@2-7e)h_iv5%y*'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = env.bool('DJANGO_DEBUG', default=False)

VERSION = ''
with open('package.json') as file:
    VERSION = json.load(file)['version']

ALLOWED_HOSTS = env.list('DJANGO_ALLOWED_HOSTS', default=[])

LOG_DIR = '/var/log/pj/'

UPLOAD_LOCATION = env('UPLOAD_LOCATION', default=None)
FILE_UPLOAD_TEMP_DIR = env('FILE_UPLOAD_TEMP_DIR', default=None)

# Application definition

INSTALLED_APPS = [
    'django.contrib.contenttypes',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'server.auth.apps.AuthConfig',
    'server.pj.apps.PjConfig',
    'rest_framework',
    'webpack_loader',
    'rest_framework.authtoken',
    'filters',
    'axes'
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'axes.middleware.AxesMiddleware',
]

ROOT_URLCONF = 'server.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [
            root('server/templates')
        ],
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

WSGI_APPLICATION = 'server.wsgi.application'

# Database
# https://docs.djangoproject.com/en/2.2/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql_psycopg2',
        'NAME': env('POSTGRES_NAME', default='postgres'),
        'USER': env('POSTGRES_USER', default='postgres'),
        'PASSWORD': env('POSTGRES_PASSWORD', default=None),
        'HOST': env('POSTGRES_HOST', default='postgres'),
        'PORT': env('POSTGRES_PORT', default=5432)
    }
}

# Email service settings
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = env('EMAIL_HOST', default=None)
EMAIL_USE_TLS = env.bool('EMAIL_USE_TLS', default=False)
EMAIL_PORT = env.int('EMAIL_PORT', default=None)
EMAIL_HOST_USER = env('EMAIL_HOST_USER', default=None)
EMAIL_HOST_PASSWORD = env('EMAIL_HOST_PASSWORD', default=None)
EMAIL_ADMIN_LIST = env.list('EMAIL_ADMIN_LIST', default=[])
EMAIL_SENDER = env('EMAIL_SENDER', default=None)

AUTH_USER_MODEL = 'custom_auth.User'

SESSION_ENGINE = "django.contrib.sessions.backends.db"
SESSION_COOKIE_AGE = 86400

AUTHENTICATION_BACKENDS = (
    # Axes need to be the first
    'axes.backends.AxesBackend',
    'django.contrib.auth.backends.ModelBackend',
)

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        # Django handles the authentication, this just picks up the authenticated user in the HttpRequest
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ),
    'DEFAULT_THROTTLE_RATES': {
        'anon': '5/minute'
    }
}

CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
    }
}

# Password validation
# https://docs.djangoproject.com/en/2.2/ref/settings/#auth-password-validators

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
# https://docs.djangoproject.com/en/2.2/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'America/New_York'

USE_I18N = True

USE_L10N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/2.2/howto/static-files/

STATIC_URL = env.url('DJANGO_STATIC_URL', default='/static/').geturl()
STATIC_ROOT = env.str('DJANGO_STATIC_ROOT', default='/srv/static/')

# Include webpack build as static files
STATICFILES_DIRS = [
    root('build/web')
]

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'filters': {
        'user': {
            '()': 'server.logging.UserFilter'
        }
    },
    'formatters': {
        'django.server': {
            '()': 'server.logging.UTCFormatter',
            'format': '[%(asctime)s] %(message)s'
        },
        'django.pj': {
            '()': 'server.logging.UTCFormatter',
            'format': '[%(asctime)s] %(name)s %(username)s - %(message)s'
        }
    },
    'handlers': {
        'django.server': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'django.server'
        },
        'file': {
            'level': 'DEBUG',
            'class': 'logging.handlers.TimedRotatingFileHandler',
            'filename': os.path.join(LOG_DIR, 'pj.log'),
            'when': 'd',
            'interval': 7,
            'utc': True,
            'formatter': 'django.pj',
            'filters': ['user']
        },
        'stream': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'django.pj',
            'filters': ['user']
        }
    },
    'loggers': {
        'django': {
            'handlers': ['file', 'stream'],
            'level': 'INFO'
        },
        'django.server': {
            'handlers': ['django.server'],
            'level': 'INFO'
        },
        'server': {
            'handlers': ['file', 'stream'],
            'level': 'DEBUG',
            'propagate': False
        },
    }
}


# Webpack
# https://github.com/owais/django-webpack-loader

WEBPACK_LOADER = {
    'DEFAULT': {
        'STATS_FILE': 'build/web/webpack-stats.json',
    }
}

# Axes settings
AXES_COOLOFF_TIME = 1  # Hours
AXES_FAILURE_LIMIT = 5
AXES_ONLY_USER_FAILURES = True
AXES_RESET_ON_SUCCESS = True
AXES_ENABLED = not env.bool('PJ_LOCKOUT_DISABLED', default=False)