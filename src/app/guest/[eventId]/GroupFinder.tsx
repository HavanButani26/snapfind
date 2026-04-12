'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface FacePerson {
    photo_id: string
    thumbnail_url: string
    face_bbox: { x: number; y: number; w: number; h: number } | null
}

interface GroupPhoto {
    id: string
    public_url: string
    thumbnail_url: string | null
}

interface GroupFinderProps {
    eventId: string
    onBack: () => void
}

export function GroupFinder({ eventId, onBack }: GroupFinderProps) {
    const [people, setPeople] = useState<FacePerson[]>([])
    const [selected, setSelected] = useState<Set<string>>(new Set())
    const [results, setResults] = useState<GroupPhoto[] | null>(null)
    const [searching, setSearching] = useState(false)
    const [loadingPeople, setLoadingPeople] = useState(true)

    useEffect(() => {
        loadPeople()
    }, [eventId])

    async function loadPeople() {
        const supabase = createClient()

        // Get one representative face per unique photo (deduplicated)
        const { data } = await supabase
            .from('face_embeddings')
            .select('photo_id, face_bbox')
            .eq('event_id', eventId)
            .eq('face_index', 0)   // only primary face per photo
            .limit(40)

        if (!data) { setLoadingPeople(false); return }

        // Get thumbnails for these photos
        const photoIds = [...new Set(data.map(d => d.photo_id))]
        const { data: photos } = await supabase
            .from('photos')
            .select('id, thumbnail_url')
            .in('id', photoIds)

        const photoMap = Object.fromEntries((photos ?? []).map(p => [p.id, p.thumbnail_url]))

        const persons: FacePerson[] = data
            .filter(d => photoMap[d.photo_id])
            .map(d => ({
                photo_id: d.photo_id,
                thumbnail_url: photoMap[d.photo_id],
                face_bbox: d.face_bbox,
            }))

        setPeople(persons)
        setLoadingPeople(false)
    }

    function togglePerson(photoId: string) {
        setSelected(prev => {
            const next = new Set(prev)
            if (next.has(photoId)) next.delete(photoId)
            else if (next.size < 4) next.add(photoId)
            return next
        })
        setResults(null)
    }

    async function findGroupPhotos() {
        if (selected.size < 2) return
        setSearching(true)
        setResults(null)

        try {
            const res = await fetch('/api/face/group-search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    event_id: eventId,
                    person_photo_ids: Array.from(selected),
                    top_k: 20,
                }),
            })
            const data = await res.json()
            setResults(data.photos ?? [])
        } catch {
            setResults([])
        }
        setSearching(false)
    }

    const [lightbox, setLightbox] = useState<string | null>(null)

    return (
        <div>
            {/* Back button */}
            <button
                onClick={onBack}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-5 transition-colors"
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 18l-6-6 6-6" />
                </svg>
                Back to my photos
            </button>

            <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
                <h2 className="font-semibold text-gray-900 mb-1">Group photo finder</h2>
                <p className="text-sm text-gray-400 mb-5">
                    Select 2–4 people to find all photos where everyone appears together
                </p>

                {loadingPeople ? (
                    <div className="grid grid-cols-5 gap-2">
                        {Array.from({ length: 10 }).map((_, i) => (
                            <div key={i} className="aspect-square rounded-xl bg-gray-100 animate-pulse" />
                        ))}
                    </div>
                ) : people.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm">
                        No faces indexed yet. Upload photos and click &quot;Process AI&quot; in the dashboard first.
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-5 gap-2 mb-5">
                            {people.map(person => {
                                const isSelected = selected.has(person.photo_id)
                                return (
                                    <button
                                        key={person.photo_id}
                                        onClick={() => togglePerson(person.photo_id)}
                                        className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${isSelected
                                                ? 'border-violet-500 scale-95'
                                                : 'border-transparent hover:border-gray-200'
                                            }`}
                                    >
                                        <img
                                            src={person.thumbnail_url}
                                            alt="Person"
                                            className="w-full h-full object-cover"
                                            loading="lazy"
                                        />
                                        {isSelected && (
                                            <div className="absolute inset-0 bg-violet-600/20 flex items-center justify-center">
                                                <div className="w-5 h-5 bg-violet-600 rounded-full flex items-center justify-center">
                                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                                                        <polyline points="20 6 9 17 4 12" />
                                                    </svg>
                                                </div>
                                            </div>
                                        )}
                                    </button>
                                )
                            })}
                        </div>

                        <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-400">
                                {selected.size === 0
                                    ? 'Tap faces to select'
                                    : selected.size === 1
                                        ? 'Select at least one more'
                                        : `${selected.size} people selected`}
                            </p>
                            <button
                                onClick={findGroupPhotos}
                                disabled={selected.size < 2 || searching}
                                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {searching ? 'Searching...' : 'Find group photos'}
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Results */}
            {results !== null && (
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    {results.length === 0 ? (
                        <div className="text-center py-6">
                            <p className="text-gray-500 font-medium mb-1">No group photos found</p>
                            <p className="text-gray-400 text-sm">No photos contain all selected people together</p>
                        </div>
                    ) : (
                        <>
                            <p className="text-sm font-medium text-gray-900 mb-3">
                                {results.length} group photo{results.length !== 1 ? 's' : ''} found
                            </p>
                            <div className="grid grid-cols-3 gap-2">
                                {results.map(photo => (
                                    <div
                                        key={photo.id}
                                        className="aspect-square rounded-xl overflow-hidden cursor-pointer"
                                        onClick={() => setLightbox(photo.public_url)}
                                    >
                                        <img
                                            src={photo.thumbnail_url || photo.public_url}
                                            alt="Group photo"
                                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                            loading="lazy"
                                        />
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
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
                        src={lightbox}
                        alt="Group photo"
                        className="max-h-[80vh] max-w-full rounded-xl object-contain"
                        onClick={e => e.stopPropagation()}
                    />
                    <a
                        href={lightbox}
                        download
                        onClick={e => e.stopPropagation()}
                        className="mt-4 px-5 py-2.5 bg-white text-gray-900 rounded-xl text-sm font-medium"
                    >
                        Download
                    </a>
                </div>
            )}
        </div>
    )
}