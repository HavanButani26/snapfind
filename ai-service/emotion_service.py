from deepface import DeepFace
import numpy as np
import cv2
from typing import Optional
import logging

logger = logging.getLogger(__name__)

EMOTION_MAP = {
    "happy": "happy",
    "sad": "sad",
    "angry": "angry",
    "surprise": "surprise",
    "fear": "fear",
    "disgust": "disgust",
    "neutral": "neutral",
}


def analyze_emotion(
    img_bgr: np.ndarray,
    face_bbox: Optional[dict] = None,
) -> dict:
    """
    Returns dominant emotion + all scores.
    Crops to face bbox if provided for better accuracy.
    """
    try:
        if face_bbox:
            x, y, w, h = (
                int(face_bbox["x"]),
                int(face_bbox["y"]),
                int(face_bbox["w"]),
                int(face_bbox["h"]),
            )
            pad = 20
            x1 = max(0, x - pad)
            y1 = max(0, y - pad)
            x2 = min(img_bgr.shape[1], x + w + pad)
            y2 = min(img_bgr.shape[0], y + h + pad)
            cropped = img_bgr[y1:y2, x1:x2]
        else:
            cropped = img_bgr

        result = DeepFace.analyze(
            img_path=cropped,
            actions=["emotion"],
            enforce_detection=False,
            silent=True,
        )

        if isinstance(result, list):
            result = result[0]

        dominant = result.get("dominant_emotion", "neutral")
        scores = result.get("emotion", {})

        normalized = {
            k: round(float(v) / 100, 4)
            for k, v in scores.items()
        }

        return {
            "emotion": EMOTION_MAP.get(dominant, "neutral"),
            "emotion_scores": normalized,
        }

    except Exception as e:
        logger.warning(f"Emotion analysis failed: {e}")
        return {"emotion": "neutral", "emotion_scores": {}}