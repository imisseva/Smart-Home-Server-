#!/bin/bash
set -e

echo "Waiting for database..."
# (Tùy chọn) Kiểm tra kết nối database trước khi chạy tiếp

echo "Collecting static files..."
# Giúp tránh lỗi "No directory at: /app/staticfiles/" bằng cách gom file tĩnh
python manage.py collectstatic --noinput

echo "Running migrations..."
# Cập nhật cấu trúc database tự động
python manage.py migrate --noinput

echo "Starting Django server với cấu hình tối ưu RAM..."

# THAY ĐỔI QUAN TRỌNG:
# 1. --workers 2: Giảm từ 3 xuống 2 để tránh tràn RAM 512MB của Render.
# 2. --threads 4: Sử dụng thread để xử lý nhiều request cùng lúc mà không tốn nhiều RAM như worker.
# 3. --worker-class gthread: Chế độ chạy luồng giúp tiết kiệm tài nguyên.
# 4. --timeout 300: Tăng thời gian chờ lên 5 phút để tránh lỗi [CRITICAL] WORKER TIMEOUT khi xử lý AI/Ảnh.

exec gunicorn config.wsgi:application \
    --bind 0.0.0.0:${PORT:-8000} \
    --workers 2 \
    --threads 4 \
    --worker-class gthread \
    --timeout 300 \
    --log-level info
