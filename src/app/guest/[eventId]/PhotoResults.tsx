'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { cn } from '@/lib/utils'

interface MatchedPhoto {
    photo_id: string
    public_url: string
    thumbnail_url: string | null
    similarity: number
    emotion: string | null
    emotion_scores: Record<string, number> | null
}

interface PhotoResultsProps {
    photos: MatchedPhoto[]
    selfiePreview: string | null
    eventId: string
    eventTitle: string
    onReset: () => void
    onSwitchGroup: () => void
    onNewSearch: (photos: MatchedPhoto[], preview: string) => void
}

const EMOTION_CONFIG: Record<string, { label: string; emoji: string; color: string }> = {
    happy: { label: 'Smiling', emoji: '😄', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
    surprise: { label: 'Surprised', emoji: '😮', color: 'bg-orange-50 text-orange-700 border-orange-200' },
    neutral: { label: 'Neutral', emoji: '😐', color: 'bg-gray-100  text-gray-600   border-gray-200' },
    sad: { label: 'Sad', emoji: '😔', color: 'bg-blue-50   text-blue-700   border-blue-200' },
    angry: { label: 'Angry', emoji: '😠', color: 'bg-red-50    text-red-700    border-red-200' },
    fear: { label: 'Fearful', emoji: '😨', color: 'bg-purple-50 text-purple-700 border-purple-200' },
    disgust: { label: 'Disgusted', emoji: '😒', color: 'bg-green-50  text-green-700  border-green-200' },
}

export function PhotoResults({
    photos, selfiePreview, eventId, eventTitle,
    onReset, onSwitchGroup, onNewSearch,
}: PhotoResultsProps) {
    const [emotionFilter, setEmotionFilter] = useState('all')
    const [lightbox, setLightbox] = useState<MatchedPhoto | null>(null)
    const [searching, setSearching] = useState(false)

    // Emotions that actually appear in results
    const availableEmotions = Array.from(
        new Set(photos.map(p => p.emotion).filter(Boolean))
    ) as string[]

    const filtered = emotionFilter === 'all'
        ? photos
        : photos.filter(p => p.emotion === emotionFilter)

    // Re-search with new selfie
    const onDrop = useCallback(async (files: File[]) => {
        if (!files[0]) return
        setSearching(true)
        const preview = URL.createObjectURL(files[0])

        try {
            const formData = new FormData()
            formData.append('selfie', files[0])
            formData.append('event_id', eventId)

            const res = await fetch('/api/face/search', { method: 'POST', body: formData })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            onNewSearch(data.photos ?? [], preview)
        } catch {
            // stay on current results
        }
        setSearching(false)
    }, [eventId, onNewSearch])

    const { getRootProps, getInputProps } = useDropzone({
        onDrop, accept: { 'image/*': [] }, maxFiles: 1,
    })

    function shareWhatsApp() {
        const url = `${window.location.origin}/guest/${eventId}`
        const msg = encodeURIComponent(
            `Found ${photos.length} photos of me at "${eventTitle}" using AI face recognition! Check it out: ${url}`
        )
        window.open(`https://wa.me/?text=${msg}`, '_blank')
    }

    function downloadAll() {
        photos.slice(0, 10).forEach((photo, i) => {
            setTimeout(() => {
                const a = document.createElement('a')
                a.href = photo.public_url
                a.download = `photo-${i + 1}.jpg`
                a.target = '_blank'
                a.click()
            }, i * 300)
        })
    }

    return (
        <>
            {/* Result summary bar */}
            <div className="bg-white rounded-2xl p-4 border border-gray-100 mb-4">
                <div className="flex items-center gap-3">
                    {selfiePreview && (
                        <img src={selfiePreview} alt="You" className="w-12 h-12 rounded-full object-cover border-2 border-violet-200" />
                    )}
                    <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900">
                            {photos.length > 0 ? `${photos.length} photos found` : 'No photos found'}
                        </p>
                        <p className="text-xs text-gray-400">
                            {photos.length > 0 ? 'Sorted by match confidence' : 'Try a clearer selfie with good lighting'}
                        </p>
                    </div>
                    <div {...getRootProps()} className="cursor-pointer">
                        <input {...getInputProps()} />
                        <button className="text-xs text-violet-600 border border-violet-200 px-3 py-1.5 rounded-lg hover:bg-violet-50 transition-colors whitespace-nowrap">
                            {searching ? 'Searching...' : 'New selfie'}
                        </button>
                    </div>
                </div>

                {photos.length > 0 && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
                        <button
                            onClick={shareWhatsApp}
                            className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-medium transition-colors"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.121.555 4.11 1.523 5.84L.057 24l6.305-1.654A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.007-1.373l-.36-.214-3.732.979.995-3.638-.235-.374A9.818 9.818 0 1112 21.818z" />
                            </svg>
                            Share on WhatsApp
                        </button>
                        <button
                            onClick={downloadAll}
                            className="flex-1 flex items-center justify-center gap-2 py-2 border border-gray-200 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                            </svg>
                            Download all
                        </button>
                    </div>
                )}
            </div>

            {photos.length === 0 ? (
                <div className="bg-white rounded-2xl p-10 text-center border border-gray-100">
                    <div className="w-16 h-16 bg-gray-50 rounded-full mx-auto flex items-center justify-center mb-4">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5">
                            <circle cx="12" cy="8" r="4" />
                            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                        </svg>
                    </div>
                    <p className="text-gray-500 font-medium mb-1">No photos found</p>
                    <p className="text-gray-400 text-sm mb-5">Try a clear, well-lit front-facing selfie</p>
                    <button onClick={onReset} className="px-5 py-2.5 bg-violet-600 text-white text-sm rounded-xl hover:bg-violet-700 transition-colors">
                        Try again
                    </button>
                </div>
            ) : (
                <>
                    {/* Emotion filter */}
                    {availableEmotions.length > 1 && (
                        <div className="flex gap-2 mb-4 flex-wrap">
                            <button
                                onClick={() => setEmotionFilter('all')}
                                className={cn(
                                    'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                                    emotionFilter === 'all'
                                        ? 'bg-violet-600 text-white border-violet-600'
                                        : 'bg-white text-gray-600 border-gray-200 hover:border-violet-300'
                                )}
                            >
                                All ({photos.length})
                            </button>
                            {availableEmotions.map(em => {
                                const cfg = EMOTION_CONFIG[em]
                                const count = photos.filter(p => p.emotion === em).length
                                if (!cfg || count === 0) return null
                                return (
                                    <button
                                        key={em}
                                        onClick={() => setEmotionFilter(em)}
                                        className={cn(
                                            'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                                            emotionFilter === em
                                                ? 'bg-violet-600 text-white border-violet-600'
                                                : `${cfg.color} border hover:opacity-80`
                                        )}
                                    >
                                        {cfg.emoji} {cfg.label} ({count})
                                    </button>
                                )
                            })}
                        </div>
                    )}

                    {/* Group finder CTA */}
                    <button
                        onClick={onSwitchGroup}
                        className="w-full mb-4 flex items-center gap-3 bg-violet-50 hover:bg-violet-100 border border-violet-100 rounded-xl px-4 py-3 transition-colors text-left"
                    >
                        <div className="w-9 h-9 bg-violet-100 rounded-lg flex items-center justify-center shrink-0">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.8">
                                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-violet-700">Find group photos</p>
                            <p className="text-xs text-violet-500">Find photos with multiple specific people together</p>
                        </div>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" className="ml-auto shrink-0">
                            <path d="M9 18l6-6-6-6" />
                        </svg>
                    </button>

                    {/* Photo grid */}
                    <div className="grid grid-cols-3 gap-2">
                        {filtered.map(photo => {
                            const cfg = photo.emotion ? EMOTION_CONFIG[photo.emotion] : null
                            return (
                                <div
                                    key={photo.photo_id}
                                    className="aspect-square rounded-xl overflow-hidden cursor-pointer relative group"
                                    onClick={() => setLightbox(photo)}
                                >
                                    <img
                                        src={photo.thumbnail_url || photo.public_url}
                                        alt="Your photo"
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        loading="lazy"
                                    />
                                    {cfg && (
                                        <div className="absolute top-1.5 left-1.5">
                                            <span className="text-base leading-none">{cfg.emoji}</span>
                                        </div>
                                    )}
                                    <div className="absolute bottom-1.5 right-1.5 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded-full">
                                        {Math.round(photo.similarity * 100)}%
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </>
            )}

            {/* Lightbox */}
            {lightbox && (
                <div
                    className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-4"
                    onClick={() => setLightbox(null)}
                >
                    <button className="absolute top-4 right-4 text-white/60 hover:text-white">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                    <img
                        src={lightbox.public_url}
                        alt="Photo"
                        className="max-h-[75vh] max-w-full rounded-xl object-contain"
                        onClick={e => e.stopPropagation()}
                    />
                    {lightbox.emotion && EMOTION_CONFIG[lightbox.emotion] && (
                        <div className={`mt-3 px-3 py-1.5 rounded-full text-xs font-medium border ${EMOTION_CONFIG[lightbox.emotion].color}`}>
                            {EMOTION_CONFIG[lightbox.emotion].emoji} {EMOTION_CONFIG[lightbox.emotion].label}
                        </div>
                    )}
                    <div className="flex gap-3 mt-4" onClick={e => e.stopPropagation()}>
                        <a
                            href={lightbox.public_url}
                            download
                            className="px-5 py-2.5 bg-white text-gray-900 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors"
                        >
                            Download
                        </a>
                        <button
                            onClick={() => {
                                const msg = encodeURIComponent(`Check out this photo from ${eventTitle}!`)
                                window.open(`https://wa.me/?text=${msg}%20${encodeURIComponent(lightbox.public_url)}`, '_blank')
                            }}
                            className="px-5 py-2.5 bg-green-500 text-white rounded-xl text-sm font-medium hover:bg-green-600 transition-colors"
                        >
                            Share
                        </button>
                        <button
                            onClick={async () => {
                                await fetch('/api/photos/react', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        photo_id: lightbox.photo_id,
                                        event_id: eventId,
                                        reaction: '❤️',
                                    }),
                                })
                            }}
                            className="px-5 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition-colors"
                        >
                            ❤️ React
                        </button>
                    </div>
                </div>
            )}
        </>
    )
}