FROM python:3.11-slim

WORKDIR /app

ENV INSIGHTFACE_HOME=/app/.insightface
ENV NO_ALBUMENTATIONS_UPDATE=1

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

RUN pip install --no-cache-dir --upgrade pip setuptools wheel

RUN pip install --no-cache-dir \
    "numpy<2.0" \
    "onnx==1.16.1" \
    "onnxruntime==1.19.2" \
    "opencv-python-headless==4.10.0.84" \
    "scipy<1.14.0" \
    "scikit-image<0.23.0" \
    "scikit-learn<1.4.0" \
    "albumentations==1.3.1" \
    "insightface==0.7.3" \
    "fastapi==0.115.0" \
    "uvicorn[standard]==0.30.6" \
    "python-multipart==0.0.12" \
    "Pillow==10.4.0" \
    "httpx==0.27.2" \
    "supabase==2.7.4" \
    "python-dotenv==1.0.1" \
    "easydict" \
    "prettytable" \
    "tqdm" \
    "requests"

# Verify ABI consistency
RUN python -c "\
import numpy as np; print('numpy:', np.__version__); \
import scipy; print('scipy:', scipy.__version__); \
import skimage; print('skimage:', skimage.__version__); \
import insightface; print('insightface imported ok')"

# Pre-download buffalo_sc model (lighter, fits in 512MB RAM)
RUN python -c "\
from insightface.app import FaceAnalysis; \
app = FaceAnalysis(name='buffalo_l', providers=['CPUExecutionProvider']); \
app.prepare(ctx_id=0, det_size=(640, 640)); \
print('buffalo_l model cached')"

# Pre-download FER+ emotion model
RUN mkdir -p models && wget -q \
    "https://github.com/onnx/models/raw/main/validated/vision/body_analysis/emotion_ferplus/model/emotion-ferplus-8.onnx" \
    -O models/emotion-ferplus-8.onnx && \
    echo "Emotion model: $(du -sh models/emotion-ferplus-8.onnx)"

# Full sanity check
RUN python -c "\
import numpy as np; \
import onnxruntime as ort; \
from insightface.app import FaceAnalysis; \
sess = ort.InferenceSession('models/emotion-ferplus-8.onnx', providers=['CPUExecutionProvider']); \
out = sess.run(None, {sess.get_inputs()[0].name: np.zeros((1,1,64,64), dtype=np.float32)}); \
print('All OK — numpy:', np.__version__, '| emotion output:', out[0].shape)"

COPY . .

EXPOSE 8000

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 1"]