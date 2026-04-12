'use client'

import { useState } from 'react'
import type { Quotation } from '@/types'
import { generateQuotationPDF } from '@/lib/pdf'

const STATUS_STYLES: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600',
    sent: 'bg-blue-50 text-blue-700',
    accepted: 'bg-green-50 text-green-700',
    rejected: 'bg-red-50 text-red-600',
    paid: 'bg-violet-50 text-violet-700',
}

const NEXT_STATUSES: Record<string, Quotation['status'][]> = {
    draft: ['sent', 'rejected'],
    sent: ['accepted', 'rejected'],
    accepted: ['paid', 'rejected'],
    rejected: [],
    paid: [],
}

interface Props {
    quotation: Quotation
    onEdit: () => void
    onUpdateStatus: (id: string, status: Quotation['status']) => void
    onDelete: (id: string) => void
}

export function QuotationCard({ quotation: q, onEdit, onUpdateStatus, onDelete }: Props) {
    const [menuOpen, setMenuOpen] = useState(false)
    const client = (q as any).clients
    const event = (q as any).events

    return (
        <div className="bg-white border border-gray-100 rounded-xl p-5 hover:border-gray-200 transition-colors">
            <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <span className="text-sm font-mono text-gray-400">{q.quote_number}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STATUS_STYLES[q.status]}`}>
                            {q.status}
                        </span>
                    </div>
                    <h3 className="font-medium text-gray-900 truncate">{q.title}</h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 flex-wrap">
                        {client && <span>{client.name}</span>}
                        {event && <><span>·</span><span>{event.title}</span></>}
                        {q.valid_until && <><span>·</span><span>Valid until {q.valid_until}</span></>}
                    </div>
                </div>

                <div className="flex items-center gap-3 ml-4">
                    <div className="text-right">
                        <p className="text-lg font-semibold text-gray-900">
                            ₹{Number(q.total).toLocaleString('en-IN')}
                        </p>
                        <p className="text-xs text-gray-400">incl. {q.tax_percent}% GST</p>
                    </div>

                    <div className="relative">
                        <button
                            onClick={() => setMenuOpen(!menuOpen)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" />
                            </svg>
                        </button>

                        {menuOpen && (
                            <div
                                className="absolute right-0 top-9 bg-white border border-gray-100 rounded-xl shadow-lg z-20 min-w-44 py-1"
                                onMouseLeave={() => setMenuOpen(false)}
                            >
                                <button onClick={() => { onEdit(); setMenuOpen(false) }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                    Edit
                                </button>
                                <button onClick={() => { generateQuotationPDF(q); setMenuOpen(false) }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                    Download PDF
                                </button>
                                {NEXT_STATUSES[q.status].map(s => (
                                    <button key={s} onClick={() => { onUpdateStatus(q.id, s); setMenuOpen(false) }}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 capitalize">
                                        Mark as {s}
                                    </button>
                                ))}
                                <div className="border-t border-gray-100 mt-1 pt-1">
                                    <button onClick={() => { onDelete(q.id); setMenuOpen(false) }}
                                        className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50">
                                        Delete
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Status action buttons */}
            {NEXT_STATUSES[q.status].length > 0 && (
                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-50">
                    {NEXT_STATUSES[q.status].map(s => (
                        <button
                            key={s}
                            onClick={() => onUpdateStatus(q.id, s)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${s === 'paid' ? 'bg-violet-600 text-white hover:bg-violet-700' :
                                    s === 'rejected' ? 'border border-red-200 text-red-500 hover:bg-red-50' :
                                        'border border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            {s === 'paid' ? 'Mark as paid' :
                                s === 'sent' ? 'Send to client' :
                                    s === 'accepted' ? 'Mark accepted' : `Mark as ${s}`}
                        </button>
                    ))}
                    <button
                        onClick={() => generateQuotationPDF(q)}
                        className="ml-auto px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 flex items-center gap-1.5"
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                        </svg>
                        PDF
                    </button>
                </div>
            )}
        </div>
    )
}