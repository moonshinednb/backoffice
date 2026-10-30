FROM python:3.12-slim
WORKDIR /app
COPY server.py store.py accounting.py events.py integrations.py ./
COPY public ./public
ENV MOONSHINE_HOST=0.0.0.0 MOONSHINE_PORT=8765 MOONSHINE_DATA=/data PYTHONUNBUFFERED=1
VOLUME /data
EXPOSE 8765
CMD ["python3", "server.py"]
