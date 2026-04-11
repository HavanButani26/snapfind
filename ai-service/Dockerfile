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

# Pin numpy FIRST — must happen before anything else resolves it
RUN pip install --no-cache-dir "numpy==1.26.4"

# Core ONNX stack
RUN pip install --no-cache-dir \
    "onnx==1.16.1" \
    "onnxruntime==1.19.2" \
    "opencv-python-headless==4.10.0.84"

# insightface — install with no-deps to prevent albumentations pulling numpy2
RUN pip install --no-cache-dir "insightface==0.7.3" --no-deps

# insightface actual runtime deps (explicit, safe versions)
RUN pip install --no-cache-dir \
    "onnx==1.16.1" \
    "tqdm" \
    "requests" \
    "Pillow==10.4.0" \
    "easydict" \
    "prettytable" \
    "scikit-learn==1.3.2" \
    "scikit-image==0.22.0" \
    "matplotlib" \
    "albumentations==1.3.1"

# Web + utility packages
RUN pip install --no-cache-dir \
    "fastapi==0.115.0" \
    "uvicorn[standard]==0.30.6" \
    "python-multipart==0.0.12" \
    "httpx==0.27.2" \
    "supabase==2.7.4" \
    "python-dotenv==1.0.1"

# Force correct numpy + scipy at the very end — overrides anything that snuck in
RUN pip install --no-cache-dir --force-reinstall \
    "numpy==1.26.4" \
    "scipy==1.13.1"

# Force onnx pin too
RUN pip install --no-cache-dir --force-reinstall "onnx==1.16.1"

# Download InsightFace buffalo_l model into image layer
RUN python -c "\
from insightface.app import FaceAnalysis; \
app = FaceAnalysis(name='buffalo_l', providers=['CPUExecutionProvider']); \
app.prepare(ctx_id=0); \
print('InsightFace ready')"

# Download FER+ ONNX emotion model
RUN mkdir -p models && wget -q \
    "https://github.com/onnx/models/raw/main/validated/vision/body_analysis/emotion_ferplus/model/emotion-ferplus-8.onnx" \
    -O models/emotion-ferplus-8.onnx && \
    echo "Emotion model: $(du -sh models/emotion-ferplus-8.onnx)"

# Verify full startup works before shipping the image
RUN python -c "\
import numpy as np; \
print('numpy:', np.__version__); \
import scipy; print('scipy:', scipy.__version__); \
import onnxruntime as ort; print('onnxruntime:', ort.__version__); \
import insightface; print('insightface ok'); \
import onnxruntime as ort; \
sess = ort.InferenceSession('models/emotion-ferplus-8.onnx', providers=['CPUExecutionProvider']); \
out = sess.run(None, {sess.get_inputs()[0].name: np.zeros((1,1,64,64), dtype=np.float32)}); \
print('emotion model ok, output shape:', out[0].shape)"

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]