'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'

interface MatchedPhoto {
    photo_id: string
    public_url: string
    thumbnail_url: string | null
    similarity: number
    emotion: string | null
    emotion_scores: Record<string, number> | null
}

interface SelfieSearchProps {
    eventId: string
    onResults: (photos: MatchedPhoto[], preview: string) => void
}

type Step = 'landing' | 'preview' | 'searching'

export function SelfieSearch({ eventId, onResults }: SelfieSearchProps) {
    const [step, setStep] = useState<Step>('landing')
    const [selfieFile, setSelfieFile] = useState<File | null>(null)
    const [selfiePreview, setSelfiePreview] = useState<string | null>(null)
    const [error, setError] = useState('')

    const onDrop = useCallback((files: File[]) => {
        if (files[0]) {
            setSelfieFile(files[0])
            setSelfiePreview(URL.createObjectURL(files[0]))
            setStep('preview')
            setError('')
        }
    }, [])

    const { getRootProps, getInputProps } = useDropzone({
        onDrop,
        accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
        maxFiles: 1,
    })

    async function search() {
        if (!selfieFile || !selfiePreview) return
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

            onResults(data.photos ?? [], selfiePreview)
        } catch (err: any) {
            setError(err.message)
            setStep('preview')
        }
    }

    if (step === 'landing') return (
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
            <p className="text-gray-400 text-sm mb-5">AI will find all your photos from this event instantly</p>
            <div className="px-6 py-3 bg-violet-600 text-white rounded-xl text-sm font-medium inline-block">
                Choose a photo
            </div>
        </div>
    )

    if (step === 'preview') return (
        <div className="bg-white rounded-2xl p-6 text-center border border-gray-100">
            <div className="relative w-32 h-32 mx-auto mb-5">
                <img
                    src={selfiePreview!}
                    alt="Your selfie"
                    className="w-32 h-32 rounded-full object-cover border-4 border-violet-100"
                />
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                </div>
            </div>

            {error && (
                <div className="mb-4 px-4 py-2.5 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">
                    {error}
                </div>
            )}

            <p className="font-medium text-gray-900 mb-1">Ready to search</p>
            <p className="text-gray-400 text-sm mb-6">We&apos;ll scan all event photos for your face</p>

            <div className="flex gap-3">
                <button
                    onClick={() => setStep('landing')}
                    className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                    Change photo
                </button>
                <button
                    onClick={search}
                    className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-medium transition-colors"
                >
                    Find my photos
                </button>
            </div>
        </div>
    )

    return (
        <div className="bg-white rounded-2xl p-10 text-center border border-gray-100">
            <div className="relative w-20 h-20 mx-auto mb-5">
                <img src={selfiePreview!} alt="You" className="w-20 h-20 rounded-full object-cover border-4 border-violet-100" />
                <div className="absolute inset-0 rounded-full border-4 border-violet-600 border-t-transparent animate-spin" />
            </div>
            <h2 className="font-semibold text-gray-900 mb-2">Scanning photos...</h2>
            <p className="text-gray-400 text-sm">AI is searching for your face</p>
            <div className="mt-5 flex gap-1 justify-center">
                {[0, 1, 2].map(i => (
                    <div key={i} className="w-2 h-2 bg-violet-400 rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
            </div>
        </div>
    )
}