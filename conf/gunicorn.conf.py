"""gunicorn WSGI server configuration."""
from multiprocessing import cpu_count

def max_workers():
    return cpu_count() * 2 + 1

bind = '0.0.0.0:8000'
workers = max_workers()
worker_class = 'gevent'
accesslog = '/tmp/gunicorn.log'
errorlog = '/tmp/gunicorn.errlog'
