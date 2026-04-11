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

# Step 1 — pin ml_dtypes first so nothing can pull a conflicting version
RUN pip install --no-cache-dir "ml_dtypes==0.4.0"

# Step 2 — core numeric + onnx pinned before insightface installs it
RUN pip install --no-cache-dir \
    "numpy==1.26.4" \
    "onnx==1.16.1" \
    "onnxruntime==1.19.2" \
    "opencv-python-headless==4.10.0.84"

# Step 3 — insightface (will reuse already-installed onnx==1.16.1)
RUN pip install --no-cache-dir "insightface==0.7.3"

# Step 4 — web + utility packages
RUN pip install --no-cache-dir \
    "fastapi==0.115.0" \
    "uvicorn[standard]==0.30.6" \
    "python-multipart==0.0.12" \
    "Pillow==10.4.0" \
    "httpx==0.27.2" \
    "supabase==2.7.4" \
    "python-dotenv==1.0.1" \
    "scipy==1.14.1"

# Step 5 — tensorflow-cpu last so it respects already-pinned ml_dtypes
RUN pip install --no-cache-dir \
    "tensorflow-cpu==2.17.1" \
    "tf-keras==2.17.0" \
    "deepface==0.0.93"

# Force onnx back to pinned version in case tensorflow pulled a newer one
RUN pip install --no-cache-dir --force-reinstall "onnx==1.16.1" "ml_dtypes==0.4.0"

# Warm-up: download buffalo_l model into image layer
RUN python -c "\
from insightface.app import FaceAnalysis; \
app = FaceAnalysis(name='buffalo_l', providers=['CPUExecutionProvider']); \
app.prepare(ctx_id=0); \
print('InsightFace ready')"

# Warm-up: download DeepFace emotion model into image layer
RUN python -c "\
from deepface import DeepFace; \
import numpy as np; \
img = np.zeros((100,100,3), dtype=np.uint8); \
DeepFace.analyze(img, actions=['emotion'], enforce_detection=False, silent=True); \
print('DeepFace ready')" || true

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]