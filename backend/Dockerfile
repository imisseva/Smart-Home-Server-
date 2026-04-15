# Sử dụng Python 3.10 slim (nhẹ, ổn định)
FROM python:3.10-slim

# Thiết lập biến môi trường
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Tạo thư mục làm việc trong container
WORKDIR /app

# Cài đặt system dependencies (cần thiết cho OpenCV + MediaPipe + psycopg2)
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy file thư viện vào trước để tận dụng cache của Docker
COPY requirements.txt /app/

# Cài đặt các thư viện Python
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy toàn bộ code server vào container
COPY . /app/

# Tạo thư mục staticfiles (WhiteNoise cần)
RUN python manage.py collectstatic --noinput || true

# Mở port 8000
EXPOSE 8000

# Dùng Gunicorn thay vì runserver (chuẩn production)
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "2", "--timeout", "120"]