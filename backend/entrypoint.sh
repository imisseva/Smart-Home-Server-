#!/bin/bash
set -e

echo "Waiting for database..."
# Đợi database sẵn sàng (nếu cần)
# Có thể thêm healthcheck script ở đây

echo "Running migrations..."
python manage.py migrate --noinput

echo "Starting Django server..."
exec python manage.py runserver 0.0.0.0:8000

