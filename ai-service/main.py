import os
import logging
from contextlib import asynccontextmanager
from typing import Optional

import numpy as np
from fastapi import FastAPI, File, Form, UploadFile, HTTPException, Depends
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
    get_face_app,
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


def verify_secret(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    if not credentials or credentials.credentials != AI_SECRET:
        raise HTTPException(status_code=401, detail="Invalid or missing API secret")
    return True


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Warm up models on startup
    logger.info("Warming up AI models...")
    get_face_app()
    logger.info("Models ready.")
    yield


app = FastAPI(title="SnapFind AI Service", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "snapfind-ai"}


# ─── Process a single photo (extract faces + emotions, store embeddings) ───────

@app.post("/process-photo", dependencies=[Depends(verify_secret)])
async def process_photo(
    photo_id: str = Form(...),
    event_id: str = Form(...),
    image_url: str = Form(...),
):
    try:
        logger.info(f"Processing photo {photo_id}")

        image_bytes = await download_image(image_url)
        img_bgr = image_from_bytes(image_bytes)

        faces = extract_embeddings(img_bgr)

        if not faces:
            # Mark as processed with no faces
            supabase.table("photos").update(
                {"is_processed": True}
            ).eq("id", photo_id).execute()
            return {"photo_id": photo_id, "faces_found": 0}

        rows = []
        for face in faces:
            emotion_data = analyze_emotion(img_bgr, face.get("face_bbox"))
            rows.append(
                {
                    "photo_id": photo_id,
                    "event_id": event_id,
                    "embedding": face["embedding"],
                    "face_index": face["face_index"],
                    "emotion": emotion_data["emotion"],
                    "emotion_scores": emotion_data["emotion_scores"],
                    "face_bbox": face["face_bbox"],
                }
            )

        supabase.table("face_embeddings").insert(rows).execute()
        supabase.table("photos").update(
            {"is_processed": True}
        ).eq("id", photo_id).execute()

        logger.info(f"Photo {photo_id}: {len(faces)} faces indexed")
        return {"photo_id": photo_id, "faces_found": len(faces)}

    except Exception as e:
        logger.error(f"process_photo error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ─── Search: match selfie against event face embeddings ───────────────────────

@app.post("/search", dependencies=[Depends(verify_secret)])
async def search_faces(
    selfie: UploadFile = File(...),
    event_id: str = Form(...),
    threshold: float = Form(0.45),
    top_k: int = Form(20),
):
    try:
        selfie_bytes = await selfie.read()
        img_bgr = image_from_bytes(selfie_bytes)
        faces = extract_embeddings(img_bgr)

        if not faces:
            raise HTTPException(
                status_code=400,
                detail="No face detected in selfie. Please use a clear front-facing photo.",
            )

        query_embedding = best_face_embedding(faces)
        if not query_embedding:
            raise HTTPException(status_code=400, detail="Could not extract face embedding.")

        # Fetch all embeddings for this event
        response = (
            supabase.table("face_embeddings")
            .select("photo_id, embedding, emotion, emotion_scores")
            .eq("event_id", event_id)
            .execute()
        )

        rows = response.data or []
        if not rows:
            return {"photos": [], "matched": 0}

        # Score each stored embedding
        scored: dict[str, dict] = {}
        for row in rows:
            sim = cosine_similarity(query_embedding, row["embedding"])
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

        # Sort by similarity descending
        top_ids = sorted(
            scored.values(), key=lambda x: x["similarity"], reverse=True
        )[:top_k]

        # Fetch photo URLs
        photo_ids = [r["photo_id"] for r in top_ids]
        photos_response = (
            supabase.table("photos")
            .select("id, public_url, thumbnail_url")
            .in_("id", photo_ids)
            .execute()
        )

        photo_map = {p["id"]: p for p in (photos_response.data or [])}

        results = []
        for scored_photo in top_ids:
            pid = scored_photo["photo_id"]
            photo = photo_map.get(pid)
            if photo:
                results.append(
                    {
                        "photo_id": pid,
                        "public_url": photo["public_url"],
                        "thumbnail_url": photo.get("thumbnail_url"),
                        "similarity": scored_photo["similarity"],
                        "emotion": scored_photo["emotion"],
                        "emotion_scores": scored_photo["emotion_scores"],
                    }
                )

        logger.info(
            f"Search event={event_id}: {len(rows)} embeddings scanned, {len(results)} matched"
        )
        return {"photos": results, "matched": len(results)}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ─── Group photo finder: photos containing ALL selected people ─────────────────

@app.post("/group-search", dependencies=[Depends(verify_secret)])
async def group_search(req: GroupSearchRequest):
    """
    Find photos where multiple specific people all appear together.
    person_photo_ids = list of photo IDs, one per person (their representative photo).
    """
    try:
        if len(req.person_photo_ids) < 2:
            raise HTTPException(
                status_code=400, detail="Select at least 2 people for group search."
            )

        # Get one representative embedding per person
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
                query_embeddings.append(resp.data[0]["embedding"])

        if len(query_embeddings) < 2:
            return {"photos": [], "matched": 0}

        # Fetch all event embeddings
        all_resp = (
            supabase.table("face_embeddings")
            .select("photo_id, embedding")
            .eq("event_id", req.event_id)
            .execute()
        )

        rows = all_resp.data or []

        # For each photo, check which query people appear in it
        photo_matches: dict[str, set[int]] = {}
        threshold = 0.45

        for row in rows:
            pid = row["photo_id"]
            for i, qemb in enumerate(query_embeddings):
                sim = cosine_similarity(qemb, row["embedding"])
                if sim >= threshold:
                    if pid not in photo_matches:
                        photo_matches[pid] = set()
                    photo_matches[pid].add(i)

        # Keep only photos where ALL people were found
        all_people = set(range(len(query_embeddings)))
        group_photos = [
            pid for pid, found in photo_matches.items()
            if found == all_people
        ]

        if not group_photos:
            return {"photos": [], "matched": 0}

        photos_resp = (
            supabase.table("photos")
            .select("id, public_url, thumbnail_url")
            .in_("id", group_photos)
            .execute()
        )

        return {
            "photos": photos_resp.data or [],
            "matched": len(group_photos),
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"group_search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ─── Batch process all unprocessed photos in an event ─────────────────────────

@app.post("/batch-process", dependencies=[Depends(verify_secret)])
async def batch_process(event_id: str = Form(...)):
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
                    rows.append(
                        {
                            "photo_id": photo["id"],
                            "event_id": event_id,
                            "embedding": face["embedding"],
                            "face_index": face["face_index"],
                            "emotion": emotion_data["emotion"],
                            "emotion_scores": emotion_data["emotion_scores"],
                            "face_bbox": face["face_bbox"],
                        }
                    )

                if rows:
                    supabase.table("face_embeddings").insert(rows).execute()

                supabase.table("photos").update(
                    {"is_processed": True}
                ).eq("id", photo["id"]).execute()

                results.append(
                    {"photo_id": photo["id"], "faces": len(faces), "status": "ok"}
                )

            except Exception as e:
                logger.error(f"Failed photo {photo['id']}: {e}")
                results.append(
                    {"photo_id": photo["id"], "faces": 0, "status": "error", "error": str(e)}
                )

        return {"processed": len(results), "results": results}

    except Exception as e:
        logger.error(f"batch_process error: {e}")
        raise HTTPException(status_code=500, detail=str(e))