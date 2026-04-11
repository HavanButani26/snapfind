'use client'

import { useState, useEffect, useRef, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Photo } from '@/types'

export default function WallPage({ params }: { params: Promise<{ eventId: string }> }) {
    const { eventId } = use(params)
    const [photos, setPhotos] = useState<Photo[]>([])
    const [eventTitle, setEventTitle] = useState('')
    const [newPhotoIds, setNewPhotoIds] = useState<Set<string>>(new Set())
    const [connected, setConnected] = useState(false)
    const [photoCount, setPhotoCount] = useState(0)
    const knownIdsRef = useRef<Set<string>>(new Set())
    const pollRef = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        const supabase = createClient()

        // 1. Load initial data first
        async function init() {
            const [{ data: event }, { data: initialPhotos }] = await Promise.all([
                supabase.from('events').select('title').eq('id', eventId).single(),
                supabase
                    .from('photos')
                    .select('*')
                    .eq('event_id', eventId)
                    .order('created_at', { ascending: false })
                    .limit(40),
            ])

            setEventTitle(event?.title ?? 'Live Event')

            const photos = initialPhotos ?? []
            setPhotos(photos)
            setPhotoCount(photos.length)
            photos.forEach(p => knownIdsRef.current.add(p.id))
        }

        // 2. Poll every 8 seconds as a guaranteed fallback
        function startPolling() {
            pollRef.current = setInterval(async () => {
                const { data } = await supabase
                    .from('photos')
                    .select('*')
                    .eq('event_id', eventId)
                    .order('created_at', { ascending: false })
                    .limit(40)

                if (!data) return

                const truly_new = data.filter(p => !knownIdsRef.current.has(p.id))
                if (truly_new.length > 0) {
                    truly_new.forEach(p => knownIdsRef.current.add(p.id))
                    setPhotos(data)
                    setPhotoCount(data.length)
                    flashNew(truly_new.map(p => p.id))
                }
            }, 8000)
        }

        // 3. Realtime subscription — works instantly when WebSocket is live
        function startRealtime() {
            const channel = supabase
                .channel(`wall-photos-${eventId}`, {
                    config: { broadcast: { self: true } },
                })
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
                        if (knownIdsRef.current.has(photo.id)) return // already shown by poll

                        knownIdsRef.current.add(photo.id)
                        setPhotos(prev => {
                            const updated = [photo, ...prev].slice(0, 40)
                            setPhotoCount(updated.length)
                            return updated
                        })
                        flashNew([photo.id])
                    }
                )
                .subscribe((status) => {
                    setConnected(status === 'SUBSCRIBED')
                })

            return channel
        }

        init()
        const channel = startRealtime()
        startPolling()

        return () => {
            supabase.removeChannel(channel)
            if (pollRef.current) clearInterval(pollRef.current)
        }
    }, [eventId])

    function flashNew(ids: string[]) {
        setNewPhotoIds(prev => {
            const next = new Set([...prev, ...ids])
            return next
        })
        setTimeout(() => {
            setNewPhotoIds(prev => {
                const next = new Set(prev)
                ids.forEach(id => next.delete(id))
                return next
            })
        }, 3500)
    }

    return (
        <div className="min-h-screen bg-gray-950 text-white overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`} />
                    <span className="text-white/50 text-xs font-medium tracking-widest uppercase">
                        {connected ? 'Live' : 'Connecting...'}
                    </span>
                </div>
                <h1 className="text-white font-semibold text-lg">{eventTitle}</h1>
                <div className="text-white/40 text-sm">{photoCount} photos</div>
            </div>

            {/* New photo flash banner */}
            {newPhotoIds.size > 0 && (
                <div className="fixed top-16 inset-x-0 flex justify-center z-50 pointer-events-none">
                    <div className="bg-violet-600 text-white text-sm font-medium px-6 py-2 rounded-full shadow-lg animate-bounce mt-3">
                        {newPhotoIds.size === 1 ? 'New photo just added!' : `${newPhotoIds.size} new photos!`}
                    </div>
                </div>
            )}

            {/* Grid */}
            {photos.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[80vh] gap-3">
                    <div className="w-16 h-16 border border-white/10 rounded-full flex items-center justify-center">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1" opacity="0.3">
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <path d="M21 15l-5-5L5 21" />
                        </svg>
                    </div>
                    <p className="text-white/30 text-sm">Waiting for photos to be uploaded...</p>
                </div>
            ) : (
                <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-2 p-4">
                    {photos.map((photo) => {
                        const isNew = newPhotoIds.has(photo.id)
                        return (
                            <div
                                key={photo.id}
                                className="break-inside-avoid mb-2 rounded-lg overflow-hidden"
                                style={{
                                    transition: 'box-shadow 0.5s ease, transform 0.5s ease',
                                    boxShadow: isNew ? '0 0 0 3px #7c3aed, 0 0 24px #7c3aed88' : 'none',
                                    transform: isNew ? 'scale(1.02)' : 'scale(1)',
                                }}
                            >
                                <img
                                    src={photo.thumbnail_url ?? photo.public_url}
                                    alt="Event photo"
                                    className="w-full object-cover"
                                    loading="lazy"
                                />
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}