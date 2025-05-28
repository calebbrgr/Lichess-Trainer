FROM python:3.11-slim

WORKDIR /app/flaskapp
COPY flaskapp /app/flaskapp
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

