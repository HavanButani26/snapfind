'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatBytes } from '@/lib/utils'
import type { Photo, Event } from '@/types'

export default function PhotosPage() {
    const [photos, setPhotos] = useState<Photo[]>([])
    const [events, setEvents] = useState<Event[]>([])
    const [selectedEvent, setSelectedEvent] = useState('all')
    const [loading, setLoading] = useState(true)
    const [lightbox, setLightbox] = useState<Photo | null>(null)
    const [stats, setStats] = useState({ total: 0, processed: 0, totalSize: 0 })

    useEffect(() => { fetchData() }, [])

    async function fetchData() {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: userEvents } = await supabase
            .from('events')
            .select('*')
            .eq('photographer_id', user.id)
            .order('created_at', { ascending: false })

        setEvents(userEvents ?? [])

        const eventIds = (userEvents ?? []).map(e => e.id)
        if (eventIds.length === 0) { setLoading(false); return }

        const { data: allPhotos } = await supabase
            .from('photos')
            .select('*')
            .in('event_id', eventIds)
            .order('created_at', { ascending: false })

        const photos = allPhotos ?? []
        setPhotos(photos)
        setStats({
            total: photos.length,
            processed: photos.filter(p => p.is_processed).length,
            totalSize: photos.reduce((s, p) => s + (p.file_size ?? 0), 0),
        })
        setLoading(false)
    }

    const filtered = selectedEvent === 'all'
        ? photos
        : photos.filter(p => p.event_id === selectedEvent)

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-semibold text-gray-900">Photos</h1>
                <p className="text-sm text-gray-500 mt-1">All photos across your events</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white border border-gray-100 rounded-xl p-5">
                    <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
                    <p className="text-sm text-gray-500 mt-1">Total photos</p>
                </div>
                <div className="bg-white border border-gray-100 rounded-xl p-5">
                    <p className="text-2xl font-semibold text-violet-600">{stats.processed}</p>
                    <p className="text-sm text-gray-500 mt-1">AI processed</p>
                </div>
                <div className="bg-white border border-gray-100 rounded-xl p-5">
                    <p className="text-2xl font-semibold text-gray-900">{formatBytes(stats.totalSize)}</p>
                    <p className="text-sm text-gray-500 mt-1">Storage used</p>
                </div>
            </div>

            {/* Event filter */}
            <div className="flex gap-2 mb-6 flex-wrap">
                <button
                    onClick={() => setSelectedEvent('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${selectedEvent === 'all'
                            ? 'bg-violet-600 text-white'
                            : 'bg-white border border-gray-200 text-gray-600 hover:border-violet-300'
                        }`}
                >
                    All events ({photos.length})
                </button>
                {events.map(event => (
                    <button
                        key={event.id}
                        onClick={() => setSelectedEvent(event.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${selectedEvent === event.id
                                ? 'bg-violet-600 text-white'
                                : 'bg-white border border-gray-200 text-gray-600 hover:border-violet-300'
                            }`}
                    >
                        {event.title} ({photos.filter(p => p.event_id === event.id).length})
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="grid grid-cols-5 gap-3">
                    {Array.from({ length: 15 }).map((_, i) => (
                        <div key={i} className="aspect-square bg-gray-100 rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20 bg-white border border-gray-100 rounded-xl">
                    <div className="w-14 h-14 bg-gray-50 rounded-xl mx-auto flex items-center justify-center mb-4">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <path d="M21 15l-5-5L5 21" />
                        </svg>
                    </div>
                    <p className="text-gray-500 font-medium">No photos yet</p>
                    <p className="text-gray-400 text-sm mt-1">Upload photos from an event page</p>
                </div>
            ) : (
                <div className="grid grid-cols-5 gap-3">
                    {filtered.map(photo => (
                        <div
                            key={photo.id}
                            className="relative group aspect-square rounded-xl overflow-hidden bg-gray-100 cursor-pointer"
                            onClick={() => setLightbox(photo)}
                        >
                            <img
                                src={photo.thumbnail_url ?? photo.public_url}
                                alt={photo.file_name ?? 'Photo'}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                loading="lazy"
                            />

                            {/* Quality dot */}
                            <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${photo.quality_score > 0.6 ? 'bg-green-400' :
                                    photo.quality_score > 0.3 ? 'bg-yellow-400' : 'bg-red-400'
                                }`} />

                            {/* AI processed badge */}
                            {photo.is_processed && (
                                <div className="absolute top-2 left-2 bg-violet-600 text-white text-xs px-1.5 py-0.5 rounded font-medium">
                                    AI
                                </div>
                            )}

                            {/* Hover overlay */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-end">
                                <div className="p-2 w-full opacity-0 group-hover:opacity-100 transition-opacity">
                                    <p className="text-white text-xs truncate">{photo.file_name}</p>
                                    <p className="text-white/60 text-xs">{formatBytes(photo.file_size ?? 0)}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Lightbox */}
            {lightbox && (
                <div
                    className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
                    onClick={() => setLightbox(null)}
                >
                    <button
                        className="absolute top-4 right-4 text-white/60 hover:text-white"
                        onClick={() => setLightbox(null)}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>

                    <div
                        className="flex gap-8 items-center max-w-5xl w-full"
                        onClick={e => e.stopPropagation()}
                    >
                        <img
                            src={lightbox.public_url}
                            alt={lightbox.file_name ?? 'Photo'}
                            className="max-h-[80vh] max-w-[70vw] rounded-xl object-contain"
                        />
                        <div className="text-white min-w-52">
                            <p className="font-medium mb-1 truncate">{lightbox.file_name}</p>
                            <p className="text-white/50 text-sm">{formatBytes(lightbox.file_size ?? 0)}</p>
                            {lightbox.width && lightbox.height && (
                                <p className="text-white/50 text-sm">{lightbox.width} × {lightbox.height}px</p>
                            )}
                            <p className="text-white/50 text-sm mt-1">
                                Quality: {Math.round(lightbox.quality_score * 100)}%
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                                <div className={`w-2 h-2 rounded-full ${lightbox.is_processed ? 'bg-violet-400' : 'bg-gray-500'
                                    }`} />
                                <span className="text-white/50 text-sm">
                                    {lightbox.is_processed ? 'AI processed' : 'Not processed'}
                                </span>
                            </div>
                            <a
                                href={lightbox.public_url}
                                download
                                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm transition-colors"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                                </svg>
                                Download original
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}