# ==========================================
# 1. Builder Stage
# ==========================================
FROM python:3.13-slim as builder

# Prevents Python from writing pyc files.
ENV PYTHONDONTWRITEBYTECODE=1
# Keeps Python from buffering stdout and stderr to avoid situations where
# the application crashes without emitting any logs due to buffering.
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install build dependencies (if needed by any Python packages)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Create a virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt


# ==========================================
# 2. Runtime Stage
# ==========================================
FROM python:3.13-slim as runtime

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Add standard library database client dependencies (for psycopg2 if used later)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy the virtual environment from the builder stage
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Create a non-root user
RUN groupadd -r appgroup && useradd -r -g appgroup appuser

# Create persistent data directories and set permissions
RUN mkdir -p /app/data /app/media /app/staticfiles && \
    chown -R appuser:appgroup /app/data /app/media /app/staticfiles

# Copy application code
COPY --chown=appuser:appgroup . /app/

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8000

# Start command
# We run migrations and collectstatic at startup to ensure the mounted volume has the latest DB schema
# and static files are ready for WhiteNoise.
CMD ["sh", "-c", "python manage.py collectstatic --noinput && python manage.py migrate && gunicorn config.wsgi:application -c gunicorn.conf.py"]
