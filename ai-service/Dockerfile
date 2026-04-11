FROM python:3.11-slim

WORKDIR /app

# System deps for OpenCV + InsightFace + build tools
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    libgl1 \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps
COPY requirements.txt .
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download InsightFace model

# Pre-download DeepFace model
RUN python -c "from deepface import DeepFace; import numpy as np; img = np.zeros((100,100,3), dtype=np.uint8); DeepFace.analyze(img, actions=['emotion'], enforce_detection=False, silent=True)" || true

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]