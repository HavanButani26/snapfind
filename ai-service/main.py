import os
import logging
import asyncio
import json
from contextlib import asynccontextmanager
from typing import Optional

import numpy as np
from fastapi import FastAPI, File, Form, UploadFile, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client
from dotenv import load_dotenv

from face_service import (
    extract_embeddings,
    cosine_similarity,
    best_face_embedding,
    image_from_bytes,
    download_image,
)
from emotion_service import analyze_emotion
from models import GroupSearchRequest

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_KEY = os.environ["SUPABASE_SERVICE_KEY"]
AI_SECRET = os.environ.get("AI_SERVICE_SECRET", "dev-secret")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
security = HTTPBearer(auto_error=False)

# Global readiness flag
models_ready = False


def verify_secret(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
):
    if not credentials or credentials.credentials != AI_SECRET:
        raise HTTPException(status_code=401, detail="Invalid or missing API secret")
    return True


def load_models_sync():
    """Load models in background — does not block startup."""
    global models_ready
    try:
        logger.info("Loading InsightFace model...")
        from face_service import get_face_app
        get_face_app()
        logger.info("InsightFace ready.")

        logger.info("Loading emotion model...")
        from emotion_service import get_emotion_session
        get_emotion_session()
        logger.info("Emotion model ready.")

        models_ready = True
        logger.info("All models ready — service fully operational.")
    except Exception as e:
        logger.error(f"Model loading failed: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start model loading in a thread — don't block startup
    loop = asyncio.get_event_loop()
    loop.run_in_executor(None, load_models_sync)
    yield


app = FastAPI(title="SnapFind AI Service", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Health — always responds immediately ──────────────────────────────────────

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "snapfind-ai",
        "models_ready": models_ready,
    }


# ── Readiness — use this before sending face requests ─────────────────────────

@app.get("/ready")
async def ready():
    if not models_ready:
        raise HTTPException(status_code=503, detail="Models still loading")
    return {"status": "ready"}


# ── Process photo ─────────────────────────────────────────────────────────────

@app.post("/process-photo", dependencies=[Depends(verify_secret)])
async def process_photo(
    photo_id: str = Form(...),
    event_id: str = Form(...),
    image_url: str = Form(...),
):
    if not models_ready:
        raise HTTPException(status_code=503, detail="Models still loading, retry in 30s")
    try:
        logger.info(f"Processing photo {photo_id}")
        image_bytes = await download_image(image_url)
        img_bgr = image_from_bytes(image_bytes)
        faces = extract_embeddings(img_bgr)

        if not faces:
            supabase.table("photos").update(
                {"is_processed": True}
            ).eq("id", photo_id).execute()
            return {"photo_id": photo_id, "faces_found": 0}

        rows = []
        for face in faces:
            emotion_data = analyze_emotion(img_bgr, face.get("face_bbox"))
            rows.append({
                "photo_id": photo_id,
                "event_id": event_id,
                "embedding": face["embedding"],
                "face_index": face["face_index"],
                "emotion": emotion_data["emotion"],
                "emotion_scores": emotion_data["emotion_scores"],
                "face_bbox": face["face_bbox"],
            })

        supabase.table("face_embeddings").insert(rows).execute()
        supabase.table("photos").update(
            {"is_processed": True}
        ).eq("id", photo_id).execute()

        logger.info(f"Photo {photo_id}: {len(faces)} faces indexed")
        return {"photo_id": photo_id, "faces_found": len(faces)}

    except Exception as e:
        logger.error(f"process_photo error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── Face search ───────────────────────────────────────────────────────────────

@app.post("/search", dependencies=[Depends(verify_secret)])
async def search_faces(
    selfie: UploadFile = File(...),
    event_id: str = Form(...),
    threshold: float = Form(0.45),
    top_k: int = Form(20),
):
    if not models_ready:
        raise HTTPException(status_code=503, detail="Models still loading, retry in 30s")
    try:
        selfie_bytes = await selfie.read()
        img_bgr = image_from_bytes(selfie_bytes)
        faces = extract_embeddings(img_bgr)

        if not faces:
            raise HTTPException(
                status_code=400,
                detail="No face detected in selfie. Use a clear front-facing photo.",
            )

        query_embedding = best_face_embedding(faces)
        if not query_embedding:
            raise HTTPException(status_code=400, detail="Could not extract face embedding.")

        response = (
            supabase.table("face_embeddings")
            .select("photo_id, embedding, emotion, emotion_scores")
            .eq("event_id", event_id)
            .execute()
        )

        rows = response.data or []
        if not rows:
            return {"photos": [], "matched": 0}

        scored: dict[str, dict] = {}
        for row in rows:
            db_embedding = row["embedding"]
            if isinstance(db_embedding, str):
                db_embedding = json.loads(db_embedding)
            sim = cosine_similarity(query_embedding, db_embedding)
            pid = row["photo_id"]
            if sim >= threshold:
                if pid not in scored or sim > scored[pid]["similarity"]:
                    scored[pid] = {
                        "photo_id": pid,
                        "similarity": round(sim, 4),
                        "emotion": row.get("emotion"),
                        "emotion_scores": row.get("emotion_scores"),
                    }

        if not scored:
            return {"photos": [], "matched": 0}

        top_ids = sorted(
            scored.values(), key=lambda x: x["similarity"], reverse=True
        )[:top_k]

        photo_ids = [r["photo_id"] for r in top_ids]
        photos_response = (
            supabase.table("photos")
            .select("id, public_url, thumbnail_url")
            .in_("id", photo_ids)
            .execute()
        )

        photo_map = {p["id"]: p for p in (photos_response.data or [])}

        results = []
        for s in top_ids:
            pid = s["photo_id"]
            photo = photo_map.get(pid)
            if photo:
                results.append({
                    "photo_id": pid,
                    "public_url": photo["public_url"],
                    "thumbnail_url": photo.get("thumbnail_url"),
                    "similarity": s["similarity"],
                    "emotion": s["emotion"],
                    "emotion_scores": s["emotion_scores"],
                })

        logger.info(f"Search event={event_id}: {len(results)} matched from {len(rows)} embeddings")
        return {"photos": results, "matched": len(results)}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── Group search ──────────────────────────────────────────────────────────────
@app.post("/group-search", dependencies=[Depends(verify_secret)])
async def group_search(req: GroupSearchRequest):
    if not models_ready:
        raise HTTPException(status_code=503, detail="Models still loading, retry in 30s")
    try:
        if len(req.person_photo_ids) < 2:
            raise HTTPException(status_code=400, detail="Select at least 2 people.")

        query_embeddings = []
        for pid in req.person_photo_ids:
            resp = (
                supabase.table("face_embeddings")
                .select("embedding")
                .eq("photo_id", pid)
                .limit(1)
                .execute()
            )
            if resp.data:
                emb = resp.data[0]["embedding"]
                # 👇 Normalize query embedding too
                if isinstance(emb, str):
                    emb = json.loads(emb)
                query_embeddings.append(emb)

        if len(query_embeddings) < 2:
            return {"photos": [], "matched": 0}

        all_resp = (
            supabase.table("face_embeddings")
            .select("photo_id, embedding")
            .eq("event_id", req.event_id)
            .execute()
        )

        rows = all_resp.data or []
        photo_matches: dict[str, set] = {}
        threshold = 0.45

        for row in rows:
            pid = row["photo_id"]
            db_emb = row["embedding"]
            if isinstance(db_emb, str):
                db_emb = json.loads(db_emb)

            for i, qemb in enumerate(query_embeddings):
                # (optional safety) ensure qemb is parsed
                if isinstance(qemb, str):
                    qemb = json.loads(qemb)

                if cosine_similarity(qemb, db_emb) >= threshold:
                    photo_matches.setdefault(pid, set()).add(i)

        all_people = set(range(len(query_embeddings)))
        group_photos = [pid for pid, found in photo_matches.items() if found == all_people]

        if not group_photos:
            return {"photos": [], "matched": 0}

        photos_resp = (
            supabase.table("photos")
            .select("id, public_url, thumbnail_url")
            .in_("id", group_photos)
            .execute()
        )
        return {"photos": photos_resp.data or [], "matched": len(group_photos)}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"group_search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ── Batch process ─────────────────────────────────────────────────────────────

@app.post("/batch-process", dependencies=[Depends(verify_secret)])
async def batch_process(event_id: str = Form(...)):
    if not models_ready:
        raise HTTPException(status_code=503, detail="Models still loading, retry in 30s")
    try:
        resp = (
            supabase.table("photos")
            .select("id, event_id, public_url")
            .eq("event_id", event_id)
            .eq("is_processed", False)
            .execute()
        )

        photos = resp.data or []
        logger.info(f"Batch processing {len(photos)} photos for event {event_id}")

        results = []
        for photo in photos:
            try:
                image_bytes = await download_image(photo["public_url"])
                img_bgr = image_from_bytes(image_bytes)
                faces = extract_embeddings(img_bgr)

                rows = []
                for face in faces:
                    emotion_data = analyze_emotion(img_bgr, face.get("face_bbox"))
                    rows.append({
                        "photo_id": photo["id"],
                        "event_id": event_id,
                        "embedding": face["embedding"],
                        "face_index": face["face_index"],
                        "emotion": emotion_data["emotion"],
                        "emotion_scores": emotion_data["emotion_scores"],
                        "face_bbox": face["face_bbox"],
                    })

                if rows:
                    supabase.table("face_embeddings").insert(rows).execute()

                supabase.table("photos").update(
                    {"is_processed": True}
                ).eq("id", photo["id"]).execute()

                results.append({"photo_id": photo["id"], "faces": len(faces), "status": "ok"})

            except Exception as e:
                logger.error(f"Failed photo {photo['id']}: {e}")
                results.append({"photo_id": photo["id"], "faces": 0, "status": "error", "error": str(e)})

        return {"processed": len(results), "results": results}

    except Exception as e:
        logger.error(f"batch_process error: {e}")
        raise HTTPException(status_code=500, detail=str(e))