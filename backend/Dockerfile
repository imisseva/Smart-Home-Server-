# Sử dụng Python 3.10 slim (nhẹ, ổn định)
FROM python:3.10-slim

# Thiết lập biến môi trường
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Tạo thư mục làm việc trong container
WORKDIR /app

# Cài đặt system dependencies (nếu cần)
RUN apt-get update && apt-get install -y \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy file thư viện vào trước để tận dụng cache của Docker
COPY requirements.txt /app/

# Cài đặt các thư viện Python
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy toàn bộ code server vào container
COPY . /app/

# Mở port 8000 để bên ngoài truy cập
EXPOSE 8000

# Default command (có thể override trong docker-compose)
CMD ["bash", "entrypoint.sh"]