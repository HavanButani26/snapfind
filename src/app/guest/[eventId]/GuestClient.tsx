'use client'

import { useState } from 'react'
import { SelfieSearch } from './SelfieSearch'
import { PhotoResults } from './PhotoResults'
import { GroupFinder } from './GroupFinder'

interface MatchedPhoto {
    photo_id: string
    public_url: string
    thumbnail_url: string | null
    similarity: number
    emotion: string | null
    emotion_scores: Record<string, number> | null
}

type Mode = 'home' | 'results' | 'group'

interface GuestClientProps {
    eventId: string
    eventTitle: string
}

export default function GuestClient({ eventId, eventTitle }: GuestClientProps) {
    const [mode, setMode] = useState<Mode>('home')
    const [photos, setPhotos] = useState<MatchedPhoto[]>([])
    const [selfiePreview, setSelfiePreview] = useState<string | null>(null)

    function handleResults(matched: MatchedPhoto[], preview: string) {
        setPhotos(matched)
        setSelfiePreview(preview)
        setMode('results')
    }

    return (
        <div className="min-h-screen bg-linear-to-b from-violet-50 to-white">
            <div className="max-w-lg mx-auto px-4 py-10">

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 text-violet-600 font-semibold text-lg mb-1">
                        <div className="w-7 h-7 bg-violet-600 rounded-lg flex items-center justify-center">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
                            </svg>
                        </div>
                        SnapFind
                    </div>
                    <h1 className="text-2xl font-semibold text-gray-900">{eventTitle}</h1>
                </div>

                {/* Mode switcher — only show after first search */}
                {mode !== 'home' && (
                    <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-xl">
                        <button
                            onClick={() => setMode('results')}
                            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${mode === 'results'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            My Photos
                        </button>
                        <button
                            onClick={() => setMode('group')}
                            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${mode === 'group'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Group Finder
                        </button>
                    </div>
                )}

                {mode === 'home' && (
                    <SelfieSearch
                        eventId={eventId}
                        onResults={handleResults}
                    />
                )}

                {mode === 'results' && (
                    <PhotoResults
                        photos={photos}
                        selfiePreview={selfiePreview}
                        eventId={eventId}
                        eventTitle={eventTitle}
                        onReset={() => setMode('home')}
                        onSwitchGroup={() => setMode('group')}
                        onNewSearch={(matched, preview) => handleResults(matched, preview)}
                    />
                )}

                {mode === 'group' && (
                    <GroupFinder
                        eventId={eventId}
                        onBack={() => setMode('results')}
                    />
                )}
            </div>
        </div>
    )
}