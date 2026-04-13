import insightface
from insightface.app import FaceAnalysis
import numpy as np
import cv2
from PIL import Image
import io
import httpx
from typing import Optional
import logging

logger = logging.getLogger(__name__)

_app: Optional[FaceAnalysis] = None


def get_face_app() -> FaceAnalysis:
    global _app
    if _app is None:
        logger.info("Loading InsightFace model...")
        _app = FaceAnalysis(
            name="buffalo_l",        # lighter model ~300MB RAM vs buffalo_l ~1.5GB
            providers=["CPUExecutionProvider"],
        )
        _app.prepare(ctx_id=0, det_size=(640, 640))   # smaller det_size = less RAM
        logger.info("InsightFace model loaded.")
    return _app


def image_from_bytes(data: bytes) -> np.ndarray:
    img = Image.open(io.BytesIO(data)).convert("RGB")
    return cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)


async def download_image(url: str) -> bytes:
    async with httpx.AsyncClient(timeout=30) as client:
        res = await client.get(url)
        res.raise_for_status()
        return res.content


def extract_embeddings(img_bgr: np.ndarray) -> list[dict]:
    app = get_face_app()
    faces = app.get(img_bgr)
    results = []
    for i, face in enumerate(faces):
        embedding = face.embedding.tolist()
        bbox = face.bbox.tolist()
        results.append({
            "face_index": i,
            "embedding": embedding,
            "face_bbox": {
                "x": float(bbox[0]),
                "y": float(bbox[1]),
                "w": float(bbox[2] - bbox[0]),
                "h": float(bbox[3] - bbox[1]),
            },
            "det_score": float(face.det_score),
        })
    return results


def cosine_similarity(a: list[float], b: list[float]) -> float:
    va = np.array(a, dtype=np.float32)
    vb = np.array(b, dtype=np.float32)
    norm_a = np.linalg.norm(va)
    norm_b = np.linalg.norm(vb)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(va, vb) / (norm_a * norm_b))


def best_face_embedding(faces: list[dict]) -> Optional[list[float]]:
    if not faces:
        return None
    best = max(faces, key=lambda f: f.get("det_score", 0))
    return best["embedding"]