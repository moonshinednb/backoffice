# Stage 1: build the React frontend.
FROM node:22-slim AS frontend
WORKDIR /src
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
RUN npm run build

# Stage 2: Django API + worker.
FROM python:3.12-slim
WORKDIR /app
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ ./backend/
COPY --from=frontend /src/dist ./frontend/dist
ENV MOONSHINE_DATA=/data MOONSHINE_FRONTEND=/app/frontend/dist PYTHONUNBUFFERED=1 DJANGO_SETTINGS_MODULE=config.settings
WORKDIR /app/backend
VOLUME /data
EXPOSE 8000
CMD ["sh", "-c", "python manage.py migrate --noinput && exec gunicorn config.wsgi -b 0.0.0.0:8000 -w 3 --timeout 120 --access-logfile -"]
