from pydantic import BaseModel
from typing import Optional
import numpy as np


class FaceEmbedding(BaseModel):
    photo_id: str
    event_id: str
    face_index: int
    embedding: list[float]
    emotion: Optional[str] = None
    emotion_scores: Optional[dict[str, float]] = None
    face_bbox: Optional[dict[str, float]] = None


class SearchRequest(BaseModel):
    event_id: str
    top_k: int = 20
    threshold: float = 0.45


class SearchResult(BaseModel):
    photo_id: str
    public_url: str
    thumbnail_url: Optional[str]
    similarity: float
    emotion: Optional[str]
    emotion_scores: Optional[dict[str, float]]


class ProcessRequest(BaseModel):
    photo_id: str
    event_id: str
    image_url: str


class GroupSearchRequest(BaseModel):
    event_id: str
    person_photo_ids: list[str]
    top_k: int = 20