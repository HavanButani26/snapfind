'use client'

import { useState } from 'react'
import { formatBytes } from '@/lib/utils'
import type { Photo } from '@/types'

interface PhotoGridProps {
    photos: Photo[]
    loading: boolean
    eventId: string
}

const EMOTION_LABELS: Record<string, string> = {
    happy: 'Happy',
    sad: 'Sad',
    angry: 'Angry',
    surprise: 'Surprised',
    neutral: 'Neutral',
    fear: 'Fear',
    disgust: 'Disgust',
}

const EMOTION_COLORS: Record<string, string> = {
    happy: 'bg-yellow-50 text-yellow-700',
    surprise: 'bg-orange-50 text-orange-700',
    neutral: 'bg-gray-100 text-gray-600',
    sad: 'bg-blue-50 text-blue-700',
    angry: 'bg-red-50 text-red-600',
    fear: 'bg-purple-50 text-purple-700',
    disgust: 'bg-green-50 text-green-700',
}

export function PhotoGrid({ photos, loading, eventId }: PhotoGridProps) {
    const [lightbox, setLightbox] = useState<Photo | null>(null)
    const [emotionFilter, setEmotionFilter] = useState<string>('all')

    const emotions = Array.from(
        new Set(photos.map(p => p).flatMap(() => []))
    )

    const filtered = emotionFilter === 'all'
        ? photos
        : photos.filter(p => {
            // Will be populated after face processing
            return true
        })

    if (loading) return (
        <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="aspect-square bg-gray-100 rounded-lg animate-pulse" />
            ))}
        </div>
    )

    if (photos.length === 0) return (
        <div className="text-center py-20 bg-white border border-gray-100 rounded-xl">
            <div className="w-14 h-14 bg-gray-100 rounded-xl mx-auto flex items-center justify-center mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L5 21" />
                </svg>
            </div>
            <p className="text-gray-500 font-medium">No photos yet</p>
            <p className="text-gray-400 text-sm mt-1">Switch to the Upload tab to add photos</p>
        </div>
    )

    return (
        <>
            <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-500">{filtered.length} photos</p>
                <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-400">Quality filter:</span>
                    <select className="text-sm border border-gray-200 rounded-lg px-2 py-1 text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-500">
                        <option value="all">All photos</option>
                        <option value="high">High quality only</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
                {filtered.map(photo => (
                    <div
                        key={photo.id}
                        className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer"
                        onClick={() => setLightbox(photo)}
                    >
                        <img
                            src={photo.thumbnail_url ?? photo.public_url}
                            alt={photo.file_name ?? 'Photo'}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            loading="lazy"
                        />

                        {/* Quality indicator */}
                        <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${photo.quality_score > 0.6
                                ? 'bg-green-400'
                                : photo.quality_score > 0.3
                                    ? 'bg-yellow-400'
                                    : 'bg-red-400'
                            }`} title={`Quality: ${Math.round(photo.quality_score * 100)}%`} />

                        {/* Processed badge */}
                        {photo.is_processed && (
                            <div className="absolute top-2 left-2 bg-violet-600 text-white text-xs px-1.5 py-0.5 rounded font-medium">
                                AI
                            </div>
                        )}

                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-end">
                            <div className="p-2 w-full opacity-0 group-hover:opacity-100 transition-opacity">
                                <p className="text-white text-xs truncate">{photo.file_name}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Lightbox */}
            {lightbox && (
                <div
                    className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
                    onClick={() => setLightbox(null)}
                >
                    <button
                        className="absolute top-4 right-4 text-white/70 hover:text-white"
                        onClick={() => setLightbox(null)}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>

                    <div className="flex gap-8 items-center max-w-5xl w-full" onClick={e => e.stopPropagation()}>
                        <img
                            src={lightbox.public_url}
                            alt={lightbox.file_name ?? 'Photo'}
                            className="max-h-[80vh] max-w-[70vw] rounded-lg object-contain"
                        />
                        <div className="text-white min-w-48">
                            <p className="font-medium mb-1">{lightbox.file_name}</p>
                            <p className="text-white/50 text-sm">{formatBytes(lightbox.file_size ?? 0)}</p>
                            {lightbox.width && lightbox.height && (
                                <p className="text-white/50 text-sm">{lightbox.width} × {lightbox.height}</p>
                            )}
                            <p className="text-white/50 text-sm mt-1">
                                Quality: {Math.round(lightbox.quality_score * 100)}%
                            </p>
                            <a
                                href={lightbox.public_url}
                                download
                                className="mt-4 inline-flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors"
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
        </>
    )
}