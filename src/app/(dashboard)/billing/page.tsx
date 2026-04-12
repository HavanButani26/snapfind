'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { QuotationBuilder } from '@/components/photographer/quotation-builder'
import { QuotationCard } from '@/components/photographer/quotation-card'
import { Button } from '@/components/ui/button'
import type { Quotation, Client, Event } from '@/types'

export default function BillingPage() {
    const [quotations, setQuotations] = useState<Quotation[]>([])
    const [clients, setClients] = useState<Client[]>([])
    const [events, setEvents] = useState<Event[]>([])
    const [loading, setLoading] = useState(true)
    const [showBuilder, setShowBuilder] = useState(false)
    const [editQuotation, setEditQuotation] = useState<Quotation | null>(null)
    const [statusFilter, setStatusFilter] = useState('all')

    useEffect(() => { fetchAll() }, [])

    async function fetchAll() {
        const supabase = createClient()
        const [{ data: q }, { data: c }, { data: e }] = await Promise.all([
            supabase
                .from('quotations')
                .select('*, clients(name, email, phone), events(title)')
                .order('created_at', { ascending: false }),
            supabase.from('clients').select('*').order('name'),
            supabase.from('events').select('*').order('created_at', { ascending: false }), // <-- changed
        ])
        setQuotations(q ?? [])
        setClients(c ?? [])
        setEvents(e ?? [])
        setLoading(false)
    }

    async function updateStatus(id: string, status: Quotation['status']) {
        const supabase = createClient()
        const update: Record<string, unknown> = { status }
        if (status === 'paid') update.paid_at = new Date().toISOString()
        await supabase.from('quotations').update(update).eq('id', id)
        setQuotations(prev => prev.map(q => q.id === id ? { ...q, ...update } : q))
    }

    async function deleteQuotation(id: string) {
        const supabase = createClient()
        await supabase.from('quotations').delete().eq('id', id)
        setQuotations(prev => prev.filter(q => q.id !== id))
    }

    const filtered = statusFilter === 'all'
        ? quotations
        : quotations.filter(q => q.status === statusFilter)

    const totalPaid = quotations
        .filter(q => q.status === 'paid')
        .reduce((s, q) => s + Number(q.total), 0)

    const totalPending = quotations
        .filter(q => ['sent', 'accepted'].includes(q.status))
        .reduce((s, q) => s + Number(q.total), 0)

    const STATUS_TABS = ['all', 'draft', 'sent', 'accepted', 'paid', 'rejected']

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Billing</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage quotations and track payments</p>
                </div>
                <Button onClick={() => { setEditQuotation(null); setShowBuilder(true) }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-2">
                        <path d="M12 5v14M5 12h14" />
                    </svg>
                    New quotation
                </Button>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-white border border-gray-100 rounded-xl p-5">
                    <p className="text-sm text-gray-500 mb-1">Total quotations</p>
                    <p className="text-2xl font-semibold text-gray-900">{quotations.length}</p>
                </div>
                <div className="bg-white border border-gray-100 rounded-xl p-5">
                    <p className="text-sm text-gray-500 mb-1">Revenue collected</p>
                    <p className="text-2xl font-semibold text-green-600">
                        ₹{totalPaid.toLocaleString('en-IN')}
                    </p>
                </div>
                <div className="bg-white border border-gray-100 rounded-xl p-5">
                    <p className="text-sm text-gray-500 mb-1">Pending amount</p>
                    <p className="text-2xl font-semibold text-amber-600">
                        ₹{totalPending.toLocaleString('en-IN')}
                    </p>
                </div>
            </div>

            {/* Status filter */}
            <div className="flex gap-2 mb-6 flex-wrap">
                {STATUS_TABS.map(s => (
                    <button
                        key={s}
                        onClick={() => setStatusFilter(s)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${statusFilter === s
                                ? 'bg-violet-600 text-white'
                                : 'bg-white border border-gray-200 text-gray-600 hover:border-violet-300'
                            }`}
                    >
                        {s === 'all' ? `All (${quotations.length})` : `${s} (${quotations.filter(q => q.status === s).length})`}
                    </button>
                ))}
            </div>

            {/* Quotation list */}
            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white border border-gray-100 rounded-xl p-5 animate-pulse h-24" />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16 bg-white border border-gray-100 rounded-xl">
                    <p className="text-gray-400 text-sm">No quotations yet. Create your first one.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map(q => (
                        <QuotationCard
                            key={q.id}
                            quotation={q}
                            onEdit={() => { setEditQuotation(q); setShowBuilder(true) }}
                            onUpdateStatus={updateStatus}
                            onDelete={deleteQuotation}
                        />
                    ))}
                </div>
            )}

            {/* Builder modal */}
            {showBuilder && (
                <QuotationBuilder
                    clients={clients}
                    events={events}
                    quotation={editQuotation}
                    onClose={() => setShowBuilder(false)}
                    onSaved={() => { setShowBuilder(false); fetchAll() }}
                />
            )}
        </div>
    )
}