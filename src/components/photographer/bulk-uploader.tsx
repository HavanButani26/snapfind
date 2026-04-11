'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { cn } from '@/lib/utils'
import { formatBytes } from '@/lib/utils'

interface UploadFile {
    id: string
    file: File
    status: 'pending' | 'uploading' | 'done' | 'error'
    progress: number
    error?: string
    preview: string
}

interface BulkUploaderProps {
    eventId: string
    onUploadComplete: (count: number) => void
}

export function BulkUploader({ eventId, onUploadComplete }: BulkUploaderProps) {
    const [files, setFiles] = useState<UploadFile[]>([])
    const [uploading, setUploading] = useState(false)

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const newFiles: UploadFile[] = acceptedFiles.map(file => ({
            id: Math.random().toString(36).slice(2),
            file,
            status: 'pending',
            progress: 0,
            preview: URL.createObjectURL(file),
        }))
        setFiles(prev => [...prev, ...newFiles])
    }, [])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.heic'] },
        maxSize: 50 * 1024 * 1024, // 50MB per file
    })

    async function uploadFile(uploadFile: UploadFile): Promise<void> {
        setFiles(prev =>
            prev.map(f => f.id === uploadFile.id ? { ...f, status: 'uploading', progress: 10 } : f)
        )

        try {
            const formData = new FormData()
            formData.append('file', uploadFile.file)
            formData.append('event_id', eventId)

            const res = await fetch('/api/photos/upload', {
                method: 'POST',
                body: formData,
            })

            if (!res.ok) throw new Error('Upload failed')

            setFiles(prev =>
                prev.map(f => f.id === uploadFile.id ? { ...f, status: 'done', progress: 100 } : f)
            )
        } catch (err) {
            setFiles(prev =>
                prev.map(f =>
                    f.id === uploadFile.id
                        ? { ...f, status: 'error', progress: 0, error: 'Failed — retry' }
                        : f
                )
            )
        }
    }

    async function startUpload() {
        const pending = files.filter(f => f.status === 'pending' || f.status === 'error')
        if (pending.length === 0) return

        setUploading(true)

        // Upload in parallel batches of 3
        const batchSize = 3
        for (let i = 0; i < pending.length; i += batchSize) {
            const batch = pending.slice(i, i + batchSize)
            await Promise.all(batch.map(uploadFile))
        }

        const doneCount = files.filter(f => f.status === 'done').length + pending.length
        setUploading(false)
        onUploadComplete(doneCount)
    }

    function removeFile(id: string) {
        setFiles(prev => prev.filter(f => f.id !== id))
    }

    function clearDone() {
        setFiles(prev => prev.filter(f => f.status !== 'done'))
    }

    const pendingCount = files.filter(f => f.status === 'pending').length
    const doneCount = files.filter(f => f.status === 'done').length
    const errorCount = files.filter(f => f.status === 'error').length

    return (
        <div className="flex flex-col gap-4">
            <div
                {...getRootProps()}
                className={cn(
                    'border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors',
                    isDragActive
                        ? 'border-violet-400 bg-violet-50'
                        : 'border-gray-200 hover:border-violet-300 hover:bg-gray-50'
                )}
            >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 bg-violet-50 rounded-xl flex items-center justify-center">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.5">
                            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                    </div>
                    {isDragActive ? (
                        <p className="text-violet-600 font-medium">Drop photos here...</p>
                    ) : (
                        <>
                            <p className="font-medium text-gray-700">Drag & drop photos here</p>
                            <p className="text-sm text-gray-400">or click to browse · JPG, PNG, WEBP, HEIC · max 50MB each</p>
                        </>
                    )}
                </div>
            </div>

            {files.length > 0 && (
                <>
                    <div className="flex items-center justify-between">
                        <div className="flex gap-4 text-sm">
                            <span className="text-gray-500">{files.length} files selected</span>
                            {doneCount > 0 && <span className="text-green-600">{doneCount} uploaded</span>}
                            {errorCount > 0 && <span className="text-red-500">{errorCount} failed</span>}
                        </div>
                        <div className="flex gap-2">
                            {doneCount > 0 && (
                                <button
                                    onClick={clearDone}
                                    className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1"
                                >
                                    Clear done
                                </button>
                            )}
                            <button
                                onClick={startUpload}
                                disabled={uploading || pendingCount === 0}
                                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {uploading
                                    ? `Uploading...`
                                    : `Upload ${pendingCount > 0 ? pendingCount : ''} photo${pendingCount !== 1 ? 's' : ''}`
                                }
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-3 max-h-80 overflow-y-auto pr-1">
                        {files.map(f => (
                            <div key={f.id} className="relative group rounded-lg overflow-hidden bg-gray-100 aspect-square">
                                <img
                                    src={f.preview}
                                    alt={f.file.name}
                                    className="w-full h-full object-cover"
                                />

                                {/* Status overlay */}
                                <div className={cn(
                                    'absolute inset-0 flex flex-col items-center justify-center transition-opacity',
                                    f.status === 'pending' ? 'opacity-0 group-hover:opacity-100 bg-black/40' :
                                        f.status === 'uploading' ? 'opacity-100 bg-black/50' :
                                            f.status === 'done' ? 'opacity-100 bg-green-900/30' :
                                                'opacity-100 bg-red-900/40'
                                )}>
                                    {f.status === 'uploading' && (
                                        <svg className="animate-spin w-7 h-7 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                    )}
                                    {f.status === 'done' && (
                                        <div className="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                        </div>
                                    )}
                                    {f.status === 'error' && (
                                        <div className="text-center px-2">
                                            <div className="w-7 h-7 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-1">
                                                <span className="text-white text-xs font-bold">!</span>
                                            </div>
                                            <p className="text-white text-xs">Failed</p>
                                        </div>
                                    )}
                                    {f.status === 'pending' && (
                                        <button
                                            onClick={() => removeFile(f.id)}
                                            className="w-7 h-7 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center"
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                                                <path d="M18 6L6 18M6 6l12 12" />
                                            </svg>
                                        </button>
                                    )}
                                </div>

                                {/* File info bar */}
                                <div className="absolute bottom-0 inset-x-0 bg-black/60 px-2 py-1">
                                    <p className="text-white text-xs truncate">{f.file.name}</p>
                                    <p className="text-white/60 text-xs">{formatBytes(f.file.size)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}