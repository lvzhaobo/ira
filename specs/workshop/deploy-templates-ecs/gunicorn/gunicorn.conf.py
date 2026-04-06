import multiprocessing
import os

bind = f"0.0.0.0:{os.getenv('IRA_BACKEND_PORT', '__BACKEND_PORT__')}"
workers = int(os.getenv("GUNICORN_WORKERS", max(2, multiprocessing.cpu_count() // 2)))
threads = int(os.getenv("GUNICORN_THREADS", 2))
timeout = int(os.getenv("GUNICORN_TIMEOUT", 120))
graceful_timeout = 30
keepalive = 5

accesslog = "/var/log/ira/gunicorn-access.log"
errorlog = "/var/log/ira/gunicorn-error.log"
loglevel = os.getenv("LOG_LEVEL", "info").lower()
capture_output = True
enable_stdio_inheritance = True
