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

export interface Client {
    id: string
    photographer_id: string
    name: string
    email: string | null
    phone: string | null
    address: string | null
    created_at: string
}

export interface QuotationItem {
    description: string
    quantity: number
    rate: number
    amount: number
}

export interface Quotation {
    id: string
    photographer_id: string
    client_id: string | null
    event_id: string | null
    quote_number: string
    title: string
    status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'paid'
    items: QuotationItem[]
    subtotal: number
    tax_percent: number
    tax_amount: number
    total: number
    notes: string | null
    valid_until: string | null
    paid_at: string | null
    created_at: string
    clients?: Client
    events?: { title: string }
}