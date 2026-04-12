'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { Client, Event, Quotation, QuotationItem } from '@/types'

interface Props {
    clients: Client[]
    events: Event[]
    quotation: Quotation | null
    onClose: () => void
    onSaved: () => void
}

const DEFAULT_ITEM: QuotationItem = { description: '', quantity: 1, rate: 0, amount: 0 }

const selectClass = `w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-900
  hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent
  transition-colors cursor-pointer`

export function QuotationBuilder({ clients, events, quotation, onClose, onSaved }: Props) {
    const [title, setTitle] = useState(quotation?.title ?? '')
    const [clientId, setClientId] = useState(quotation?.client_id ?? '')
    const [eventId, setEventId] = useState(quotation?.event_id ?? '')
    const [validUntil, setValidUntil] = useState(quotation?.valid_until ?? '')
    const [taxPercent, setTaxPercent] = useState(quotation?.tax_percent ?? 18)
    const [notes, setNotes] = useState(quotation?.notes ?? '')
    const [items, setItems] = useState<QuotationItem[]>(
        quotation?.items?.length ? quotation.items : [{ ...DEFAULT_ITEM }]
    )
    const [saving, setSaving] = useState(false)

    // Inline add client
    const [showAddClient, setShowAddClient] = useState(false)
    const [newClientName, setNewClientName] = useState('')
    const [newClientEmail, setNewClientEmail] = useState('')
    const [newClientPhone, setNewClientPhone] = useState('')
    const [addingClient, setAddingClient] = useState(false)
    const [localClients, setLocalClients] = useState<Client[]>(clients)

    useEffect(() => { setLocalClients(clients) }, [clients])

    const subtotal = items.reduce((s, i) => s + i.amount, 0)
    const taxAmount = (subtotal * Number(taxPercent)) / 100
    const total = subtotal + taxAmount

    function updateItem(index: number, field: keyof QuotationItem, value: string | number) {
        setItems(prev => prev.map((item, i) => {
            if (i !== index) return item
            const updated = { ...item, [field]: value }
            if (field === 'quantity' || field === 'rate') {
                updated.amount = Number(updated.quantity) * Number(updated.rate)
            }
            return updated
        }))
    }

    function addItem() {
        setItems(prev => [...prev, { ...DEFAULT_ITEM }])
    }

    function removeItem(index: number) {
        setItems(prev => prev.filter((_, i) => i !== index))
    }

    async function addClientInline() {
        if (!newClientName.trim()) return
        setAddingClient(true)
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        const { data } = await supabase
            .from('clients')
            .insert({
                photographer_id: user!.id,
                name: newClientName.trim(),
                email: newClientEmail || null,
                phone: newClientPhone || null,
            })
            .select()
            .single()
        if (data) {
            setLocalClients(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
            setClientId(data.id)
            setShowAddClient(false)
            setNewClientName('')
            setNewClientEmail('')
            setNewClientPhone('')
        }
        setAddingClient(false)
    }

    async function save() {
        if (!title || items.every(i => !i.description)) return
        setSaving(true)
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        const payload = {
            photographer_id: user!.id,
            title,
            client_id: clientId || null,
            event_id: eventId || null,
            valid_until: validUntil || null,
            tax_percent: Number(taxPercent),
            notes: notes || null,
            items: items.filter(i => i.description),
            subtotal,
            tax_amount: taxAmount,
            total,
        }

        if (quotation) {
            await supabase.from('quotations').update(payload).eq('id', quotation.id)
        } else {
            await supabase.from('quotations').insert(payload)
        }

        setSaving(false)
        onSaved()
    }

    return (
        <div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
                    <h2 className="font-semibold text-gray-900">
                        {quotation ? 'Edit quotation' : 'New quotation'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 flex flex-col gap-5">

                    {/* Title */}
                    <Input
                        label="Quotation title"
                        placeholder="Wedding Photography — Sharma Family"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        required
                    />

                    {/* Client + Event */}
                    <div className="grid grid-cols-2 gap-4">

                        {/* Client selector */}
                        <div className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-gray-700">Client</label>
                                <button
                                    type="button"
                                    onClick={() => setShowAddClient(!showAddClient)}
                                    className="text-xs text-violet-600 hover:text-violet-700 font-medium transition-colors"
                                >
                                    {showAddClient ? 'Cancel' : '+ New client'}
                                </button>
                            </div>

                            {showAddClient ? (
                                <div className="border border-violet-200 rounded-xl p-3 bg-violet-50 flex flex-col gap-2">
                                    <input
                                        className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors"
                                        placeholder="Client name *"
                                        value={newClientName}
                                        onChange={e => setNewClientName(e.target.value)}
                                    />
                                    <input
                                        className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors"
                                        placeholder="Email (optional)"
                                        value={newClientEmail}
                                        onChange={e => setNewClientEmail(e.target.value)}
                                    />
                                    <input
                                        className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors"
                                        placeholder="Phone (optional)"
                                        value={newClientPhone}
                                        onChange={e => setNewClientPhone(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={addClientInline}
                                        disabled={!newClientName.trim() || addingClient}
                                        className="px-3 py-2 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50 font-medium"
                                    >
                                        {addingClient ? 'Adding...' : 'Add client'}
                                    </button>
                                </div>
                            ) : (
                                <select
                                    value={clientId}
                                    onChange={e => setClientId(e.target.value)}
                                    className={selectClass}
                                >
                                    <option value="">Select a client</option>
                                    {localClients.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}{c.phone ? ` · ${c.phone}` : ''}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {/* Linked event */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-gray-700">Linked event</label>
                            <select
                                value={eventId}
                                onChange={e => setEventId(e.target.value)}
                                className={selectClass}
                            >
                                <option value="">No event</option>
                                {events.map(e => (
                                    <option key={e.id} value={e.id}>{e.title}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Valid until + GST */}
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Valid until"
                            type="date"
                            value={validUntil}
                            onChange={e => setValidUntil(e.target.value)}
                        />
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-gray-700">GST %</label>
                            <select
                                value={taxPercent}
                                onChange={e => setTaxPercent(Number(e.target.value))}
                                className={selectClass}
                            >
                                {[0, 5, 12, 18, 28].map(t => (
                                    <option key={t} value={t}>{t}% GST</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Line items */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-700">Services</label>
                        <div className="border border-gray-200 rounded-xl overflow-hidden">

                            {/* Table header */}
                            <div className="grid grid-cols-12 gap-0 bg-gray-50 px-4 py-2.5 text-xs font-medium text-gray-500 border-b border-gray-100">
                                <span className="col-span-5">Description</span>
                                <span className="col-span-2 text-center">Qty</span>
                                <span className="col-span-2 text-right">Rate (₹)</span>
                                <span className="col-span-2 text-right">Amount (₹)</span>
                                <span className="col-span-1" />
                            </div>

                            {/* Items */}
                            {items.map((item, i) => (
                                <div
                                    key={i}
                                    className="grid grid-cols-12 gap-2 px-4 py-3 border-t border-gray-50 items-center"
                                >
                                    <input
                                        className="col-span-5 text-sm text-gray-900 placeholder:text-gray-400 border-0 outline-none focus:ring-0 bg-transparent"
                                        placeholder="e.g. Wedding ceremony coverage"
                                        value={item.description}
                                        onChange={e => updateItem(i, 'description', e.target.value)}
                                    />
                                    <input
                                        className="col-span-2 text-sm text-center text-gray-900 border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white transition-colors"
                                        type="number"
                                        min="1"
                                        value={item.quantity}
                                        onChange={e => updateItem(i, 'quantity', Number(e.target.value))}
                                    />
                                    <input
                                        className="col-span-2 text-sm text-right text-gray-900 border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white transition-colors"
                                        type="number"
                                        min="0"
                                        value={item.rate}
                                        onChange={e => updateItem(i, 'rate', Number(e.target.value))}
                                    />
                                    <span className="col-span-2 text-sm text-right font-medium text-gray-700">
                                        ₹{item.amount.toLocaleString('en-IN')}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => removeItem(i)}
                                        className="col-span-1 flex justify-center text-gray-300 hover:text-red-400 transition-colors"
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M18 6L6 18M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            ))}

                            {/* Add item */}
                            <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
                                <button
                                    type="button"
                                    onClick={addItem}
                                    className="text-sm text-violet-600 hover:text-violet-700 font-medium flex items-center gap-1.5 transition-colors"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="M12 5v14M5 12h14" />
                                    </svg>
                                    Add item
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Totals */}
                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex flex-col gap-2">
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>Subtotal</span>
                            <span>₹{subtotal.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>GST ({taxPercent}%)</span>
                            <span>₹{taxAmount.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between text-base font-semibold text-gray-900 pt-2 border-t border-gray-200">
                            <span>Total</span>
                            <span>₹{total.toLocaleString('en-IN')}</span>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-700">Notes (optional)</label>
                        <textarea
                            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors resize-none"
                            placeholder="Payment terms, bank details, expiry conditions..."
                            rows={3}
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 justify-end pt-2">
                        <Button variant="secondary" type="button" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button onClick={save} loading={saving} disabled={!title}>
                            {quotation ? 'Save changes' : 'Create quotation'}
                        </Button>
                    </div>

                </div>
            </div>
        </div>
    )
}