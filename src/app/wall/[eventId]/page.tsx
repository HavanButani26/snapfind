'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Photo } from '@/types'

export default function WallPage({ params }: { params: Promise<{ eventId: string }> }) {
    const { eventId } = use(params)
    const [photos, setPhotos] = useState<Photo[]>([])
    const [newest, setNewest] = useState<Photo | null>(null)
    const [eventTitle, setEventTitle] = useState('')

    useEffect(() => {
        const supabase = createClient()

        // Load initial photos
        supabase
            .from('events')
            .select('title')
            .eq('id', eventId)
            .single()
            .then(({ data }) => setEventTitle(data?.title ?? 'Live Event'))

        supabase
            .from('photos')
            .select('*')
            .eq('event_id', eventId)
            .order('created_at', { ascending: false })
            .limit(30)
            .then(({ data }) => setPhotos(data ?? []))

        // Subscribe to new photos in real-time
        const channel = supabase
            .channel(`wall:${eventId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'photos',
                    filter: `event_id=eq.${eventId}`,
                },
                (payload) => {
                    const photo = payload.new as Photo
                    setNewest(photo)
                    setPhotos(prev => [photo, ...prev].slice(0, 30))
                    setTimeout(() => setNewest(null), 4000)
                }
            )
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [eventId])

    return (
        <div className="min-h-screen bg-gray-950 text-white overflow-hidden">
            {/* Header bar */}
            <div className="flex items-center justify-between px-8 py-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-white/60 text-sm font-medium">LIVE</span>
                </div>
                <h1 className="text-white font-semibold text-lg">{eventTitle}</h1>
                <div className="text-white/40 text-sm">{photos.length} photos</div>
            </div>

            {/* New photo toast */}
            {newest && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-violet-600 text-white px-5 py-2.5 rounded-full text-sm font-medium shadow-lg z-50 animate-bounce">
                    New photo added!
                </div>
            )}

            {/* Photo grid */}
            {photos.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[80vh]">
                    <div className="w-20 h-20 border-2 border-white/20 rounded-full flex items-center justify-center mb-4">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1" opacity="0.4">
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <path d="M21 15l-5-5L5 21" />
                        </svg>
                    </div>
                    <p className="text-white/40 text-sm">Waiting for photos...</p>
                    <p className="text-white/20 text-xs mt-1">Photos will appear here as they are uploaded</p>
                </div>
            ) : (
                <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-2 p-4">
                    {photos.map((photo, i) => (
                        <div
                            key={photo.id}
                            className={`break-inside-avoid mb-2 rounded-lg overflow-hidden transition-all duration-700 ${i === 0 ? 'ring-2 ring-violet-500 ring-offset-2 ring-offset-gray-950' : ''
                                }`}
                        >
                            <img
                                src={photo.thumbnail_url ?? photo.public_url}
                                alt="Event photo"
                                className="w-full object-cover"
                                loading="lazy"
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}