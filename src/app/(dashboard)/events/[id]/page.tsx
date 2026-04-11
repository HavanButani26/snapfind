'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BulkUploader } from '@/components/photographer/bulk-uploader'
import { PhotoGrid } from '@/components/photographer/photo-grid'
import { QRModal } from '@/components/photographer/qr-modal'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import type { Event, Photo } from '@/types'

export default function EventDetailPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = use(params)
    const [event, setEvent] = useState<Event | null>(null)
    const [photos, setPhotos] = useState<Photo[]>([])
    const [loading, setLoading] = useState(true)
    const [tab, setTab] = useState<'photos' | 'upload'>('photos')
    const [showQR, setShowQR] = useState(false)

    useEffect(() => {
        fetchEvent()
        fetchPhotos()
    }, [id])

    async function fetchEvent() {
        const supabase = createClient()
        const { data } = await supabase
            .from('events')
            .select('*')
            .eq('id', id)
            .single()
        setEvent(data)
    }

    async function fetchPhotos() {
        const supabase = createClient()
        const { data } = await supabase
            .from('photos')
            .select('*')
            .eq('event_id', id)
            .order('created_at', { ascending: false })
        setPhotos(data ?? [])
        setLoading(false)
    }

    function handleUploadComplete(count: number) {
        fetchPhotos()
        fetchEvent()
        setTab('photos')
    }

    async function toggleActive() {
        const supabase = createClient()
        await supabase
            .from('events')
            .update({ is_active: !event?.is_active })
            .eq('id', id)
        setEvent(prev => prev ? { ...prev, is_active: !prev.is_active } : prev)
    }

    if (!event && !loading) return (
        <div className="text-center py-20">
            <p className="text-gray-400">Event not found.</p>
            <Link href="/events" className="text-violet-600 text-sm mt-2 inline-block">← Back to events</Link>
        </div>
    )

    return (
        <div>
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Link href="/events" className="text-gray-400 hover:text-gray-600 text-sm">Events</Link>
                        <span className="text-gray-300">/</span>
                        <span className="text-sm text-gray-700">{event?.title ?? '...'}</span>
                    </div>
                    <h1 className="text-2xl font-semibold text-gray-900">{event?.title}</h1>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
                        {event?.event_date && <span>{event.event_date}</span>}
                        {event?.location && <><span>·</span><span>{event.location}</span></>}
                        <span>·</span>
                        <span>{event?.total_photos ?? 0} photos</span>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => setShowQR(true)}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="mr-1.5">
                            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                            <rect x="3" y="14" width="7" height="7" /><path d="M14 14h3v3M17 20h3M20 17v3" />
                        </svg>
                        QR code
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={toggleActive}
                    >
                        {event?.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Link
                        href={`/wall/${id}`}
                        target="_blank"
                        className="px-4 py-2.5 border border-gray-200 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 transition-colors inline-flex items-center gap-1.5"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
                        </svg>
                        Live wall
                    </Link>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit mb-6">
                {(['photos', 'upload'] as const).map(t => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors capitalize ${tab === t
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        {t === 'photos' ? `Photos (${photos.length})` : 'Upload'}
                    </button>
                ))}
            </div>

            {/* Content */}
            {tab === 'upload' && (
                <div className="bg-white border border-gray-100 rounded-xl p-6">
                    <h2 className="font-medium text-gray-900 mb-4">Upload photos</h2>
                    <BulkUploader eventId={id} onUploadComplete={handleUploadComplete} />
                </div>
            )}

            {tab === 'photos' && (
                <PhotoGrid photos={photos} loading={loading} eventId={id} />
            )}

            {showQR && event && (
                <QRModal eventId={id} eventTitle={event.title} onClose={() => setShowQR(false)} />
            )}
        </div>
    )
}