FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    build-essential \
    g++ \
    cmake \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    libgl1 \
    libglx-mesa0 \
    wget \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --no-cache-dir --upgrade pip setuptools wheel

RUN pip install --no-cache-dir \
    numpy==1.26.4 \
    onnxruntime==1.19.2 \
    opencv-python-headless==4.10.0.84

RUN pip install --no-cache-dir insightface==0.7.3

RUN pip install --no-cache-dir \
    fastapi==0.115.0 \
    "uvicorn[standard]==0.30.6" \
    python-multipart==0.0.12 \
    Pillow==10.4.0 \
    httpx==0.27.2 \
    supabase==2.7.4 \
    python-dotenv==1.0.1 \
    scipy==1.14.1

RUN pip install --no-cache-dir \
    tensorflow-cpu==2.17.1 \
    tf-keras==2.17.0 \
    deepface==0.0.93

RUN python -c "\
from insightface.app import FaceAnalysis; \
app = FaceAnalysis(name='buffalo_l', providers=['CPUExecutionProvider']); \
app.prepare(ctx_id=0); \
print('InsightFace ready')"

RUN python -c "\
from deepface import DeepFace; \
import numpy as np; \
img = np.zeros((100,100,3), dtype=np.uint8); \
DeepFace.analyze(img, actions=['emotion'], enforce_detection=False, silent=True); \
print('DeepFace ready')" || true

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]