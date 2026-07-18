import multiprocessing
import os

bind = "0.0.0.0:8000"

# Using sync workers for simplicity, but increasing timeout for AI API calls.
worker_class = "sync"

# Formula for number of workers: (2 x $num_cores) + 1
workers = int(os.environ.get('GUNICORN_WORKERS', multiprocessing.cpu_count() * 2 + 1))

# Set a high timeout because DeepSeek/Ollama calls can be slow
timeout = int(os.environ.get('GUNICORN_TIMEOUT', 120))

# Logging
accesslog = "-"
errorlog = "-"
loglevel = "info"
