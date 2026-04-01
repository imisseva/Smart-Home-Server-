#!/bin/bash
set -e

echo "Waiting for database..."
# Đợi database sẵn sàng (nếu cần)
# Có thể thêm healthcheck script ở đây

echo "Running migrations..."
python manage.py migrate --noinput

echo "Starting Django server..."
exec gunicorn config.wsgi:application --bind 0.0.0.0:${PORT:-8000}
