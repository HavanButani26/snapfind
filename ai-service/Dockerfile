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

# Install in dependency order
RUN pip install --no-cache-dir \
    "ml_dtypes==0.4.0" \
    "numpy==1.26.4"

RUN pip install --no-cache-dir \
    "onnx==1.16.1" \
    "onnxruntime==1.19.2" \
    "opencv-python-headless==4.10.0.84"

RUN pip install --no-cache-dir "insightface==0.7.3"

RUN pip install --no-cache-dir \
    "fastapi==0.115.0" \
    "uvicorn[standard]==0.30.6" \
    "python-multipart==0.0.12" \
    "Pillow==10.4.0" \
    "httpx==0.27.2" \
    "supabase==2.7.4" \
    "python-dotenv==1.0.1" \
    "scipy==1.14.1"

# Force onnx pin — insightface may have bumped it
RUN pip install --no-cache-dir --force-reinstall "onnx==1.16.1" "ml_dtypes==0.4.0"

# Download InsightFace buffalo_l model into image cache
RUN python -c "\
from insightface.app import FaceAnalysis; \
app = FaceAnalysis(name='buffalo_l', providers=['CPUExecutionProvider']); \
app.prepare(ctx_id=0); \
print('InsightFace ready')"

# Download FER+ emotion ONNX model into image cache
RUN mkdir -p models && wget -q \
    "https://github.com/onnx/models/raw/main/validated/vision/body_analysis/emotion_ferplus/model/emotion-ferplus-8.onnx" \
    -O models/emotion-ferplus-8.onnx && \
    echo "Emotion model ready: $(du -sh models/emotion-ferplus-8.onnx)"

# Verify emotion model loads correctly
RUN python -c "\
import onnxruntime as ort; \
import numpy as np; \
sess = ort.InferenceSession('models/emotion-ferplus-8.onnx', providers=['CPUExecutionProvider']); \
dummy = np.zeros((1,1,64,64), dtype=np.float32); \
out = sess.run(None, {sess.get_inputs()[0].name: dummy}); \
print('Emotion model verified, output shape:', out[0].shape)"

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]