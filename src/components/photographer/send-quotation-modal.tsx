'use client'

import { useState } from 'react'
import { generateQuotationPDF } from '@/lib/pdf'
import type { Quotation } from '@/types'

interface Props {
    quotation: Quotation
    onClose: () => void
    onSent: () => void
}

export function SendQuotationModal({ quotation, onClose, onSent }: Props) {
    const [copied, setCopied] = useState(false)
    const [sent, setSent] = useState(false)

    const client = (quotation as any).clients
    const clientName = client?.name ?? 'Client'
    const clientPhone = client?.phone ?? ''
    const clientEmail = client?.email ?? ''

    const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL || window.location.origin

    const shareUrl = `${baseUrl}/quotation/${quotation.id}`

    const whatsappMessage = encodeURIComponent(
        `Hi ${clientName},\n\nPlease find your quotation *${quotation.quote_number}* for *${quotation.title}*.\n\n` +
        `💰 Total: ₹${Number(quotation.total).toLocaleString('en-IN')} (incl. ${quotation.tax_percent}% GST)\n` +
        (quotation.valid_until ? `📅 Valid until: ${quotation.valid_until}\n` : '') +
        `\nView quotation: ${shareUrl}\n\n` +
        `Please confirm your acceptance at your earliest convenience.\n\nThank you!`
    )

    const emailSubject = encodeURIComponent(`Quotation ${quotation.quote_number} — ${quotation.title}`)
    const emailBody = encodeURIComponent(
        `Hi ${clientName},\n\nPlease find your quotation details below:\n\n` +
        `Quotation No: ${quotation.quote_number}\n` +
        `Title: ${quotation.title}\n` +
        `Total: ₹${Number(quotation.total).toLocaleString('en-IN')} (incl. ${quotation.tax_percent}% GST)\n` +
        (quotation.valid_until ? `Valid Until: ${quotation.valid_until}\n` : '') +
        `\nView online: ${shareUrl}\n\n` +
        `Please reply to confirm acceptance.\n\nThank you!`
    )

    async function copyLink() {
        await navigator.clipboard.writeText(shareUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    function handleSentVia(method: string) {
        setSent(true)
        setTimeout(() => {
            onSent()
            onClose()
        }, 1000)
    }

    return (
        <div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="font-semibold text-gray-900">Send quotation</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6">
                    {/* Quotation summary */}
                    <div className="bg-gray-50 rounded-xl p-4 mb-5">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs text-gray-400 font-mono">{quotation.quote_number}</p>
                                <p className="font-medium text-gray-900 mt-0.5">{quotation.title}</p>
                                {clientName !== 'Client' && (
                                    <p className="text-sm text-gray-500 mt-0.5">To: {clientName}</p>
                                )}
                            </div>
                            <div className="text-right">
                                <p className="text-lg font-semibold text-gray-900">
                                    ₹{Number(quotation.total).toLocaleString('en-IN')}
                                </p>
                                {quotation.valid_until && (
                                    <p className="text-xs text-gray-400 mt-0.5">Valid till {quotation.valid_until}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {sent ? (
                        <div className="text-center py-6">
                            <div className="w-14 h-14 bg-green-50 rounded-full mx-auto flex items-center justify-center mb-3">
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            </div>
                            <p className="font-medium text-gray-900">Quotation sent!</p>
                            <p className="text-sm text-gray-400 mt-1">Status updated to sent</p>
                        </div>
                    ) : (
                        <>
                            <p className="text-sm text-gray-500 mb-4">Choose how to send this quotation to your client:</p>

                            <div className="flex flex-col gap-3">
                                {/* WhatsApp */}
                                <a
                                    href={`https://wa.me/${clientPhone.replace(/\D/g, '')}?text=${whatsappMessage}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => handleSentVia('whatsapp')}
                                    className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl hover:border-green-200 hover:bg-green-50 transition-colors group"
                                >
                                    <div className="w-10 h-10 bg-green-100 group-hover:bg-green-200 rounded-xl flex items-center justify-center shrink-0 transition-colors">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="#16a34a">
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                                            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.121.555 4.11 1.523 5.84L.057 24l6.305-1.654A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.007-1.373l-.36-.214-3.732.979.995-3.638-.235-.374A9.818 9.818 0 1112 21.818z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900">Send via WhatsApp</p>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            {clientPhone ? `Send to ${clientPhone}` : 'Opens WhatsApp with message pre-filled'}
                                        </p>
                                    </div>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                                        <path d="M9 18l6-6-6-6" />
                                    </svg>
                                </a>

                                {/* Email */}
                                <a
                                    href={`mailto:${clientEmail}?subject=${emailSubject}&body=${emailBody}`}
                                    onClick={() => handleSentVia('email')}
                                    className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl hover:border-blue-200 hover:bg-blue-50 transition-colors group"
                                >
                                    <div className="w-10 h-10 bg-blue-50 group-hover:bg-blue-100 rounded-xl flex items-center justify-center shrink-0 transition-colors">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.8">
                                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                            <polyline points="22,6 12,13 2,6" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900">Send via Email</p>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            {clientEmail ? `Send to ${clientEmail}` : 'Opens your default email app'}
                                        </p>
                                    </div>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                                        <path d="M9 18l6-6-6-6" />
                                    </svg>
                                </a>

                                {/* Download PDF */}
                                <button
                                    onClick={() => { generateQuotationPDF(quotation); handleSentVia('pdf') }}
                                    className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl hover:border-violet-200 hover:bg-violet-50 transition-colors group text-left"
                                >
                                    <div className="w-10 h-10 bg-violet-50 group-hover:bg-violet-100 rounded-xl flex items-center justify-center shrink-0 transition-colors">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.8">
                                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                                            <polyline points="14 2 14 8 20 8" />
                                            <line x1="12" y1="18" x2="12" y2="12" />
                                            <line x1="9" y1="15" x2="15" y2="15" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900">Download PDF</p>
                                        <p className="text-xs text-gray-400 mt-0.5">Save and share the PDF manually</p>
                                    </div>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                                        <path d="M9 18l6-6-6-6" />
                                    </svg>
                                </button>

                                {/* Copy link */}
                                <button
                                    onClick={copyLink}
                                    className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl hover:border-gray-200 hover:bg-gray-50 transition-colors group text-left"
                                >
                                    <div className="w-10 h-10 bg-gray-100 group-hover:bg-gray-200 rounded-xl flex items-center justify-center shrink-0 transition-colors">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.8">
                                            <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                                            <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900">Copy shareable link</p>
                                        <p className="text-xs text-gray-400 mt-0.5 font-mono break-all">{shareUrl}</p>
                                    </div>
                                    <span className={`text-xs font-medium px-2 py-1 rounded-lg transition-colors ${copied ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                        }`}>
                                        {copied ? 'Copied!' : 'Copy'}
                                    </span>
                                </button>
                            </div>

                            {/* Manual confirm */}
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <p className="text-xs text-gray-400 text-center mb-3">
                                    Already sent by other means?
                                </p>
                                <button
                                    onClick={() => handleSentVia('manual')}
                                    className="w-full py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors font-medium"
                                >
                                    Mark as sent
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}