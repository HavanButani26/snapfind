'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Photo } from '@/types'

interface Reaction {
    id: string
    photo_id: string
    reaction: string
    x: number
    y: number
}

export default function WallClient({ eventId }: { eventId: string }) {
    const [photos, setPhotos] = useState<Photo[]>([])
    const [eventTitle, setEventTitle] = useState('')
    const [newPhotoIds, setNewPhotoIds] = useState<Set<string>>(new Set())
    const [connected, setConnected] = useState(false)
    const [photoCount, setPhotoCount] = useState(0)
    const [floatingReactions, setFloatingReactions] = useState<Reaction[]>([])
    const [reactionCounts, setReactionCounts] = useState<Record<string, number>>({})
    const knownIdsRef = useRef<Set<string>>(new Set())
    const pollRef = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        const supabase = createClient()

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

            // Load reaction counts
            const { data: reactions } = await supabase
                .from('photo_reactions')
                .select('photo_id')
                .eq('event_id', eventId)

            const counts: Record<string, number> = {}
            reactions?.forEach(r => {
                counts[r.photo_id] = (counts[r.photo_id] ?? 0) + 1
            })
            setReactionCounts(counts)
        }

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

        function startRealtime() {
            const channel = supabase
                .channel(`wall-${eventId}`, { config: { broadcast: { self: true } } })
                .on('postgres_changes', {
                    event: 'INSERT', schema: 'public', table: 'photos',
                    filter: `event_id=eq.${eventId}`,
                }, (payload) => {
                    const photo = payload.new as Photo
                    if (knownIdsRef.current.has(photo.id)) return
                    knownIdsRef.current.add(photo.id)
                    setPhotos(prev => [photo, ...prev].slice(0, 40))
                    setPhotoCount(prev => prev + 1)
                    flashNew([photo.id])
                })
                .on('postgres_changes', {
                    event: 'INSERT', schema: 'public', table: 'photo_reactions',
                    filter: `event_id=eq.${eventId}`,
                }, (payload) => {
                    const r = payload.new as { photo_id: string; reaction: string }
                    setReactionCounts(prev => ({
                        ...prev,
                        [r.photo_id]: (prev[r.photo_id] ?? 0) + 1,
                    }))
                    spawnFloatingReaction(r.photo_id, r.reaction)
                })
                .subscribe(status => setConnected(status === 'SUBSCRIBED'))

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
        setNewPhotoIds(prev => new Set([...prev, ...ids]))
        setTimeout(() => {
            setNewPhotoIds(prev => {
                const next = new Set(prev)
                ids.forEach(id => next.delete(id))
                return next
            })
        }, 4000)
    }

    function spawnFloatingReaction(photoId: string, reaction: string) {
        const id = Math.random().toString(36).slice(2)
        const x = 20 + Math.random() * 60
        const y = 20 + Math.random() * 60
        const r: Reaction = { id, photo_id: photoId, reaction, x, y }
        setFloatingReactions(prev => [...prev, r])
        setTimeout(() => {
            setFloatingReactions(prev => prev.filter(fr => fr.id !== id))
        }, 2500)
    }

    return (
        <div className="min-h-screen bg-gray-950 text-white overflow-hidden relative">
            {/* Floating reactions */}
            {floatingReactions.map(r => (
                <div
                    key={r.id}
                    className="fixed pointer-events-none z-50 text-4xl animate-bounce"
                    style={{
                        left: `${r.x}%`,
                        top: `${r.y}%`,
                        animation: 'floatUp 2.5s ease-out forwards',
                    }}
                >
                    {r.reaction}
                </div>
            ))}

            <style>{`
        @keyframes floatUp {
          0%   { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-120px) scale(1.5); }
        }
      `}</style>

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

            {/* New photo banner */}
            {newPhotoIds.size > 0 && (
                <div className="fixed top-16 inset-x-0 flex justify-center z-50 pointer-events-none">
                    <div className="bg-violet-600 text-white text-sm font-medium px-6 py-2 rounded-full shadow-lg animate-bounce mt-3">
                        {newPhotoIds.size === 1 ? 'New photo just added!' : `${newPhotoIds.size} new photos!`}
                    </div>
                </div>
            )}

            {photos.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[80vh] gap-3">
                    <div className="w-16 h-16 border border-white/10 rounded-full flex items-center justify-center">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1" opacity="0.3">
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <path d="M21 15l-5-5L5 21" />
                        </svg>
                    </div>
                    <p className="text-white/30 text-sm">Waiting for photos...</p>
                </div>
            ) : (
                <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-2 p-4">
                    {photos.map(photo => {
                        const isNew = newPhotoIds.has(photo.id)
                        const reactions = reactionCounts[photo.id] ?? 0
                        return (
                            <div
                                key={photo.id}
                                className="break-inside-avoid mb-2 rounded-lg overflow-hidden relative group"
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
                                {reactions > 0 && (
                                    <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                                        <span>❤️</span>
                                        <span>{reactions}</span>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}