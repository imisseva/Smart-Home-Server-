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
    pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir gunicorn  # Đảm bảo có gunicorn

# Copy toàn bộ code server vào container
COPY . /app/

# Render sẽ tự gán PORT qua biến môi trường, EXPOSE chỉ để tham khảo
EXPOSE 10000

# Đảm bảo file entrypoint có quyền thực thi
RUN chmod +x entrypoint.sh

CMD ["./entrypoint.sh"]