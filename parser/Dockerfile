FROM python:3.12-slim

WORKDIR /app

# Системные зависимости для Pillow и PostgreSQL
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    libjpeg-dev \
    zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

RUN mkdir -p logs

COPY . .

CMD ["python", "main.py"]
