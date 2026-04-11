'use client'

import { useState, use } from 'react'
import { useDropzone } from 'react-dropzone'
import { cn } from '@/lib/utils'

type Step = 'landing' | 'upload' | 'searching' | 'results' | 'error'

interface MatchedPhoto {
    id: string
    public_url: string
    thumbnail_url: string
    emotion?: string
}

interface GuestPageProps {
    params: Promise<{ eventId: string }>
}

export default function GuestPage({ params }: GuestPageProps) {
    const { eventId } = use(params)
    const [step, setStep] = useState<Step>('landing')
    const [selfiePreview, setSelfiePreview] = useState<string | null>(null)
    const [selfieFile, setSelfieFile] = useState<File | null>(null)
    const [photos, setPhotos] = useState<MatchedPhoto[]>([])
    const [errorMsg, setErrorMsg] = useState('')
    const [emotionFilter, setEmotionFilter] = useState('all')
    const [lightbox, setLightbox] = useState<string | null>(null)

    const { getRootProps, getInputProps } = useDropzone({
        accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
        maxFiles: 1,
        onDrop: (files) => {
            if (files[0]) {
                setSelfieFile(files[0])
                setSelfiePreview(URL.createObjectURL(files[0]))
                setStep('upload')
            }
        },
    })

    async function searchPhotos() {
        if (!selfieFile) return
        setStep('searching')

        try {
            const formData = new FormData()
            formData.append('selfie', selfieFile)
            formData.append('event_id', eventId)

            const res = await fetch('/api/face/search', {
                method: 'POST',
                body: formData,
            })

            const data = await res.json()

            if (!res.ok) throw new Error(data.error || 'Search failed')

            setPhotos(data.photos ?? [])
            setStep('results')
        } catch (err: any) {
            setErrorMsg(err.message)
            setStep('error')
        }
    }

    const emotions = ['all', ...Array.from(new Set(photos.map(p => p.emotion).filter(Boolean)))] as string[]
    const filtered = emotionFilter === 'all'
        ? photos
        : photos.filter(p => p.emotion === emotionFilter)

    return (
        <div className="min-h-screen bg-linear-to-b from-violet-50 to-white">
            <div className="max-w-lg mx-auto px-4 py-12">

                {/* Header */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center gap-2 text-violet-600 font-semibold text-lg mb-2">
                        <div className="w-7 h-7 bg-violet-600 rounded-lg flex items-center justify-center">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
                            </svg>
                        </div>
                        SnapFind
                    </div>
                    <h1 className="text-2xl font-semibold text-gray-900">Find your photos</h1>
                    <p className="text-gray-500 text-sm mt-1">Take a selfie and we&apos;ll find all your photos from this event</p>
                </div>

                {/* LANDING */}
                {step === 'landing' && (
                    <div
                        {...getRootProps()}
                        className="bg-white border-2 border-dashed border-violet-200 rounded-2xl p-10 text-center cursor-pointer hover:border-violet-400 hover:bg-violet-50 transition-colors"
                    >
                        <input {...getInputProps()} />
                        <div className="w-20 h-20 bg-violet-100 rounded-full mx-auto flex items-center justify-center mb-5">
                            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.5">
                                <circle cx="12" cy="8" r="4" />
                                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                            </svg>
                        </div>
                        <h2 className="font-semibold text-gray-900 text-lg mb-2">Upload your selfie</h2>
                        <p className="text-gray-400 text-sm">Tap to take a photo or upload from gallery</p>
                        <div className="mt-5 px-5 py-2.5 bg-violet-600 text-white rounded-lg text-sm font-medium inline-block">
                            Choose photo
                        </div>
                    </div>
                )}

                {/* PREVIEW & CONFIRM */}
                {step === 'upload' && selfiePreview && (
                    <div className="bg-white rounded-2xl p-6 text-center border border-gray-100">
                        <div className="relative w-36 h-36 mx-auto mb-5">
                            <img
                                src={selfiePreview}
                                alt="Your selfie"
                                className="w-36 h-36 rounded-full object-cover border-4 border-violet-200"
                            />
                            <div className="absolute -bottom-1 -right-1 w-9 h-9 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            </div>
                        </div>
                        <p className="font-medium text-gray-900 mb-1">Looking good!</p>
                        <p className="text-gray-400 text-sm mb-6">We&apos;ll search for your face across all event photos</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => { setStep('landing'); setSelfiePreview(null) }}
                                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                                Use different photo
                            </button>
                            <button
                                onClick={searchPhotos}
                                className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-medium transition-colors"
                            >
                                Find my photos
                            </button>
                        </div>
                    </div>
                )}

                {/* SEARCHING */}
                {step === 'searching' && (
                    <div className="bg-white rounded-2xl p-10 text-center border border-gray-100">
                        <div className="relative w-20 h-20 mx-auto mb-5">
                            <img
                                src={selfiePreview!}
                                alt="Selfie"
                                className="w-20 h-20 rounded-full object-cover border-4 border-violet-100"
                            />
                            <div className="absolute inset-0 rounded-full border-4 border-violet-600 border-t-transparent animate-spin" />
                        </div>
                        <h2 className="font-semibold text-gray-900 mb-2">Scanning photos...</h2>
                        <p className="text-gray-400 text-sm">Our AI is searching for your face in all event photos</p>
                        <div className="mt-6 flex gap-1 justify-center">
                            {[0, 1, 2].map(i => (
                                <div
                                    key={i}
                                    className="w-2 h-2 bg-violet-400 rounded-full animate-bounce"
                                    style={{ animationDelay: `${i * 0.15}s` }}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* RESULTS */}
                {step === 'results' && (
                    <div>
                        <div className="bg-white rounded-2xl p-4 border border-gray-100 mb-4 flex items-center gap-3">
                            <img src={selfiePreview!} alt="You" className="w-12 h-12 rounded-full object-cover border-2 border-violet-200" />
                            <div>
                                <p className="font-medium text-gray-900">{photos.length} photos found</p>
                                <p className="text-sm text-gray-400">Tap any photo to view and download</p>
                            </div>
                            <button
                                onClick={() => setStep('landing')}
                                className="ml-auto text-xs text-violet-600 hover:underline"
                            >
                                New search
                            </button>
                        </div>

                        {photos.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                                <p className="text-gray-500 font-medium">No photos found</p>
                                <p className="text-gray-400 text-sm mt-1">Try a clearer selfie with good lighting</p>
                                <button
                                    onClick={() => setStep('landing')}
                                    className="mt-4 px-4 py-2 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-700 transition-colors"
                                >
                                    Try again
                                </button>
                            </div>
                        ) : (
                            <>
                                {/* Emotion filter */}
                                {emotions.length > 1 && (
                                    <div className="flex gap-2 mb-4 flex-wrap">
                                        {emotions.map(em => (
                                            <button
                                                key={em}
                                                onClick={() => setEmotionFilter(em)}
                                                className={cn(
                                                    'px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors',
                                                    emotionFilter === em
                                                        ? 'bg-violet-600 text-white'
                                                        : 'bg-white border border-gray-200 text-gray-600 hover:border-violet-300'
                                                )}
                                            >
                                                {em === 'all' ? 'All photos' : em === 'happy' ? 'Smiling' : em}
                                                {em !== 'all' && ` (${photos.filter(p => p.emotion === em).length})`}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                <div className="grid grid-cols-3 gap-2">
                                    {filtered.map(photo => (
                                        <div
                                            key={photo.id}
                                            className="aspect-square rounded-xl overflow-hidden cursor-pointer relative group"
                                            onClick={() => setLightbox(photo.public_url)}
                                        >
                                            <img
                                                src={photo.thumbnail_url || photo.public_url}
                                                alt="Your photo"
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                                loading="lazy"
                                            />
                                            {photo.emotion && (
                                                <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded-full capitalize">
                                                    {photo.emotion === 'happy' ? 'Smiling' : photo.emotion}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Download all */}
                                <div className="mt-4 text-center">
                                    <p className="text-xs text-gray-400">Tap each photo to download individually</p>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* ERROR */}
                {step === 'error' && (
                    <div className="bg-white rounded-2xl p-8 text-center border border-red-100">
                        <div className="w-14 h-14 bg-red-50 rounded-full mx-auto flex items-center justify-center mb-4">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5">
                                <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
                            </svg>
                        </div>
                        <p className="font-medium text-gray-900 mb-1">Something went wrong</p>
                        <p className="text-sm text-gray-400 mb-5">{errorMsg}</p>
                        <button
                            onClick={() => setStep('landing')}
                            className="px-4 py-2 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-700 transition-colors"
                        >
                            Try again
                        </button>
                    </div>
                )}
            </div>

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
                        alt="Photo"
                        className="max-h-[80vh] max-w-full rounded-lg object-contain"
                        onClick={e => e.stopPropagation()}
                    />
                    <a
                        href={lightbox}
                        download
                        onClick={e => e.stopPropagation()}
                        className="mt-4 px-5 py-2.5 bg-white text-gray-900 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors"
                    >
                        Download photo
                    </a>
                </div>
            )}
        </div>
    )
}