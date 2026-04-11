'use client'

import { useState, useEffect } from 'react'

interface QRModalProps {
    eventId: string
    eventTitle: string
    onClose: () => void
}

export function QRModal({ eventId, eventTitle, onClose }: QRModalProps) {
    const [qrData, setQrData] = useState<{ qr: string; url: string } | null>(null)
    const [loading, setLoading] = useState(true)
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        fetch(`/api/events/${eventId}/qr`)
            .then(r => r.json())
            .then(data => { setQrData(data); setLoading(false) })
    }, [eventId])

    async function copyLink() {
        if (!qrData?.url) return
        await navigator.clipboard.writeText(qrData.url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    async function downloadQR() {
        if (!qrData?.qr) return
        const a = document.createElement('a')
        a.href = qrData.qr
        a.download = `${eventTitle}-qr.png`
        a.click()
    }

    return (
        <div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl p-6 w-full max-w-sm"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-5">
                    <h2 className="font-semibold text-gray-900">Share event</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <p className="text-sm text-gray-500 mb-4">
                    Guests scan this QR code to find their photos instantly using face recognition.
                </p>

                <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-center mb-4">
                    {loading ? (
                        <div className="w-48 h-48 bg-gray-200 rounded-lg animate-pulse" />
                    ) : (
                        <img src={qrData?.qr} alt="QR Code" className="w-48 h-48 rounded-lg" />
                    )}
                </div>

                {qrData && (
                    <div className="bg-gray-50 rounded-lg px-3 py-2.5 mb-4 flex items-center gap-2">
                        <span className="text-xs text-gray-500 truncate flex-1">{qrData.url}</span>
                    </div>
                )}

                <div className="flex gap-2">
                    <button
                        onClick={copyLink}
                        className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        {copied ? 'Copied!' : 'Copy link'}
                    </button>
                    <button
                        onClick={downloadQR}
                        className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700 rounded-lg text-sm font-medium text-white transition-colors"
                    >
                        Download QR
                    </button>
                </div>

                <p className="text-xs text-gray-400 text-center mt-3">
                    Share the QR code or link with your guests
                </p>
            </div>
        </div>
    )
}