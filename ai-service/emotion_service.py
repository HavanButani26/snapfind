import numpy as np
import cv2
import onnxruntime as ort
import os
import urllib.request
import logging
from typing import Optional

logger = logging.getLogger(__name__)

EMOTION_LABELS = [
    "neutral", "happy", "surprise", "sad",
    "angry", "disgust", "fear", "contempt"
]

EMOTION_DISPLAY = {
    "neutral": "neutral",
    "happy": "happy",
    "surprise": "surprise",
    "sad": "sad",
    "angry": "angry",
    "disgust": "disgust",
    "fear": "fear",
    "contempt": "neutral",  # merge contempt → neutral
}

MODEL_PATH = "models/emotion-ferplus-8.onnx"
MODEL_URL = "https://github.com/onnx/models/raw/main/validated/vision/body_analysis/emotion_ferplus/model/emotion-ferplus-8.onnx"

_session: Optional[ort.InferenceSession] = None


def get_emotion_session() -> ort.InferenceSession:
    global _session
    if _session is None:
        os.makedirs("models", exist_ok=True)
        if not os.path.exists(MODEL_PATH):
            logger.info("Downloading emotion ONNX model...")
            urllib.request.urlretrieve(MODEL_URL, MODEL_PATH)
            logger.info("Emotion model downloaded.")
        _session = ort.InferenceSession(
            MODEL_PATH,
            providers=["CPUExecutionProvider"]
        )
        logger.info("Emotion ONNX session ready.")
    return _session


def preprocess_face(img_bgr: np.ndarray, face_bbox: Optional[dict] = None) -> np.ndarray:
    if face_bbox:
        x = max(0, int(face_bbox["x"]))
        y = max(0, int(face_bbox["y"]))
        w = max(1, int(face_bbox["w"]))
        h = max(1, int(face_bbox["h"]))
        pad = 20
        x1 = max(0, x - pad)
        y1 = max(0, y - pad)
        x2 = min(img_bgr.shape[1], x + w + pad)
        y2 = min(img_bgr.shape[0], y + h + pad)
        face = img_bgr[y1:y2, x1:x2]
    else:
        face = img_bgr

    # FER+ expects 64x64 grayscale, shape (1,1,64,64), float32
    gray = cv2.cvtColor(face, cv2.COLOR_BGR2GRAY)
    resized = cv2.resize(gray, (64, 64))
    tensor = resized.astype(np.float32)
    tensor = tensor[np.newaxis, np.newaxis, :, :]  # (1,1,64,64)
    return tensor


def analyze_emotion(
    img_bgr: np.ndarray,
    face_bbox: Optional[dict] = None,
) -> dict:
    try:
        session = get_emotion_session()
        tensor = preprocess_face(img_bgr, face_bbox)

        input_name = session.get_inputs()[0].name
        outputs = session.run(None, {input_name: tensor})
        scores = outputs[0][0]  # shape (8,)

        # Softmax
        exp_scores = np.exp(scores - np.max(scores))
        probs = exp_scores / exp_scores.sum()

        dominant_idx = int(np.argmax(probs))
        dominant = EMOTION_LABELS[dominant_idx]

        emotion_scores = {
            EMOTION_LABELS[i]: round(float(probs[i]), 4)
            for i in range(len(EMOTION_LABELS))
        }

        return {
            "emotion": EMOTION_DISPLAY.get(dominant, "neutral"),
            "emotion_scores": emotion_scores,
        }

    except Exception as e:
        logger.warning(f"Emotion analysis failed: {e}")
        return {"emotion": "neutral", "emotion_scores": {}}