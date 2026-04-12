'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import type { Client } from '@/types'

export default function ClientsPage() {
    const [clients, setClients] = useState<Client[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editClient, setEditClient] = useState<Client | null>(null)
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState<string | null>(null)
    const [form, setForm] = useState({ name: '', email: '', phone: '', address: '' })

    useEffect(() => { fetchClients() }, [])

    async function fetchClients() {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data } = await supabase
            .from('clients')
            .select('*')
            .eq('photographer_id', user.id)
            .order('name')

        setClients(data ?? [])
        setLoading(false)
    }

    function openCreate() {
        setEditClient(null)
        setForm({ name: '', email: '', phone: '', address: '' })
        setShowForm(true)
    }

    function openEdit(client: Client) {
        setEditClient(client)
        setForm({
            name: client.name,
            email: client.email ?? '',
            phone: client.phone ?? '',
            address: client.address ?? '',
        })
        setShowForm(true)
    }

    async function saveClient(e: React.FormEvent) {
        e.preventDefault()
        setSaving(true)

        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        const payload = {
            photographer_id: user!.id,
            name: form.name,
            email: form.email || null,
            phone: form.phone || null,
            address: form.address || null,
        }

        if (editClient) {
            const { data } = await supabase
                .from('clients')
                .update(payload)
                .eq('id', editClient.id)
                .select()
                .single()

            if (data) {
                setClients(prev => prev.map(c => c.id === editClient.id ? data : c))
            }
        } else {
            const { data } = await supabase
                .from('clients')
                .insert(payload)
                .select()
                .single()

            if (data) {
                setClients(prev => [data, ...prev].sort((a, b) => a.name.localeCompare(b.name)))
            }
        }

        setSaving(false)
        setShowForm(false)
        setEditClient(null)
    }

    async function deleteClient(id: string) {
        if (!confirm('Delete this client? Their quotations will not be deleted.')) return
        setDeleting(id)
        const supabase = createClient()
        await supabase.from('clients').delete().eq('id', id)
        setClients(prev => prev.filter(c => c.id !== id))
        setDeleting(null)
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Clients</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage your client contacts</p>
                </div>
                <Button onClick={openCreate}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-2">
                        <path d="M12 5v14M5 12h14" />
                    </svg>
                    Add client
                </Button>
            </div>

            {/* Create / Edit form */}
            {showForm && (
                <Card className="mb-6 p-6">
                    <h2 className="font-semibold text-gray-900 mb-4">
                        {editClient ? 'Edit client' : 'New client'}
                    </h2>
                    <form onSubmit={saveClient} className="grid grid-cols-2 gap-4">
                        <Input
                            label="Full name"
                            placeholder="Rahul Sharma"
                            value={form.name}
                            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                            required
                            className="col-span-2"
                        />
                        <Input
                            label="Email"
                            type="email"
                            placeholder="rahul@example.com"
                            value={form.email}
                            onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                        />
                        <Input
                            label="Phone"
                            placeholder="+91 98765 43210"
                            value={form.phone}
                            onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                        />
                        <Input
                            label="Address"
                            placeholder="Surat, Gujarat"
                            value={form.address}
                            onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                            className="col-span-2"
                        />
                        <div className="col-span-2 flex gap-3 justify-end">
                            <Button
                                variant="secondary"
                                type="button"
                                onClick={() => { setShowForm(false); setEditClient(null) }}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" loading={saving}>
                                {editClient ? 'Save changes' : 'Add client'}
                            </Button>
                        </div>
                    </form>
                </Card>
            )}

            {/* Client list */}
            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white border border-gray-100 rounded-xl p-5 animate-pulse h-20" />
                    ))}
                </div>
            ) : clients.length === 0 ? (
                <div className="text-center py-20 bg-white border border-gray-100 rounded-xl">
                    <div className="w-14 h-14 bg-violet-50 rounded-xl mx-auto flex items-center justify-center mb-4">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.5">
                            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                        </svg>
                    </div>
                    <p className="text-gray-500 font-medium mb-1">No clients yet</p>
                    <p className="text-gray-400 text-sm mb-4">Add your first client to use in quotations</p>
                    <Button onClick={openCreate}>Add client</Button>
                </div>
            ) : (
                <div className="bg-white border border-gray-100 rounded-xl divide-y divide-gray-50">
                    {clients.map(client => (
                        <div key={client.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-4">
                                {/* Avatar */}
                                <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-semibold text-sm shrink-0">
                                    {client.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">{client.name}</p>
                                    <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                                        {client.email && <span>{client.email}</span>}
                                        {client.phone && (
                                            <>
                                                {client.email && <span>·</span>}
                                                <span>{client.phone}</span>
                                            </>
                                        )}
                                        {client.address && (
                                            <>
                                                {(client.email || client.phone) && <span>·</span>}
                                                <span>{client.address}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => openEdit(client)}
                                    className="px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => deleteClient(client.id)}
                                    disabled={deleting === client.id}
                                    className="px-3 py-1.5 text-xs text-red-500 border border-red-100 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                                >
                                    {deleting === client.id ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}