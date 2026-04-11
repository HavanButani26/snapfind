export type UserRole = 'photographer' | 'admin'

export interface Profile {
    id: string
    email: string
    full_name: string | null
    studio_name: string | null
    phone: string | null
    avatar_url: string | null
    role: UserRole
    created_at: string
}

export interface Event {
    id: string
    photographer_id: string
    title: string
    description: string | null
    event_date: string | null
    location: string | null
    qr_code_url: string | null
    is_active: boolean
    total_photos: number
    created_at: string
}

export interface Photo {
    id: string
    event_id: string
    storage_path: string
    public_url: string
    thumbnail_url: string | null
    file_name: string | null
    file_size: number | null
    width: number | null
    height: number | null
    quality_score: number
    is_processed: boolean
    created_at: string
}

export interface FaceEmbedding {
    id: string
    photo_id: string
    event_id: string
    face_index: number
    emotion: string | null
    emotion_scores: Record<string, number> | null
    face_bbox: { x: number; y: number; w: number; h: number } | null
    created_at: string
}