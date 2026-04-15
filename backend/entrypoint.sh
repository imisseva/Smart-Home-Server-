#!/bin/bash
set -e

echo "Waiting for database..."
# (Tùy chọn) Bạn có thể thêm lệnh check database ở đây nếu muốn chắc chắn

echo "Collecting static files..."
# THÊM DÒNG NÀY: Giúp tránh lỗi "No directory at: /app/staticfiles/"
python manage.py collectstatic --noinput

echo "Running migrations..."
python manage.py migrate --noinput

echo "Starting Django server..."
# Gunicorn sẽ lắng nghe port từ biến môi trường PORT của Render (mặc định 10000)
exec gunicorn config.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers 3 --timeout 120
