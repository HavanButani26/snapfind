'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import type { Event } from '@/types'

export default function EventsPage() {
    const [events, setEvents] = useState<Event[]>([])
    const [loading, setLoading] = useState(true)
    const [showCreate, setShowCreate] = useState(false)
    const [creating, setCreating] = useState(false)
    const [form, setForm] = useState({ title: '', event_date: '', location: '', description: '' })

    useEffect(() => { fetchEvents() }, [])

    async function fetchEvents() {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data } = await supabase
            .from('events')
            .select('*')
            .eq('photographer_id', user.id)          // ← filter by current user
            .order('created_at', { ascending: false })

        setEvents(data ?? [])
        setLoading(false)
    }

    async function createEvent(e: React.FormEvent) {
        e.preventDefault()
        setCreating(true)
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        const { data, error } = await supabase
            .from('events')
            .insert({
                photographer_id: user!.id,
                title: form.title,
                event_date: form.event_date || null,
                location: form.location || null,
                description: form.description || null,
            })
            .select()
            .single()

        if (!error && data) {
            setEvents(prev => [data, ...prev])
            setShowCreate(false)
            setForm({ title: '', event_date: '', location: '', description: '' })
        }
        setCreating(false)
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Events</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage your photo events and albums</p>
                </div>
                <Button onClick={() => setShowCreate(true)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-2">
                        <path d="M12 5v14M5 12h14" />
                    </svg>
                    New event
                </Button>
            </div>

            {showCreate && (
                <Card className="mb-6 p-6">
                    <h2 className="font-semibold text-gray-900 mb-4">Create new event</h2>
                    <form onSubmit={createEvent} className="grid grid-cols-2 gap-4">
                        <Input
                            label="Event name"
                            placeholder="Sharma Wedding 2025"
                            value={form.title}
                            onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                            required
                            className="col-span-2"
                        />
                        <Input
                            label="Date"
                            type="date"
                            value={form.event_date}
                            onChange={e => setForm(p => ({ ...p, event_date: e.target.value }))}
                        />
                        <Input
                            label="Location"
                            placeholder="Surat, Gujarat"
                            value={form.location}
                            onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                        />
                        <Input
                            label="Description (optional)"
                            placeholder="Add event notes..."
                            value={form.description}
                            onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                            className="col-span-2"
                        />
                        <div className="col-span-2 flex gap-3 justify-end">
                            <Button variant="secondary" type="button" onClick={() => setShowCreate(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" loading={creating}>
                                Create event
                            </Button>
                        </div>
                    </form>
                </Card>
            )}

            {loading ? (
                <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white border border-gray-100 rounded-xl p-5 animate-pulse">
                            <div className="h-4 bg-gray-100 rounded w-3/4 mb-3" />
                            <div className="h-3 bg-gray-100 rounded w-1/2" />
                        </div>
                    ))}
                </div>
            ) : events.length === 0 ? (
                <div className="text-center py-20 bg-white border border-gray-100 rounded-xl">
                    <div className="w-14 h-14 bg-violet-50 rounded-xl mx-auto flex items-center justify-center mb-4">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.5">
                            <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
                        </svg>
                    </div>
                    <p className="text-gray-500 font-medium mb-1">No events yet</p>
                    <p className="text-gray-400 text-sm mb-4">Create your first event to get started</p>
                    <Button onClick={() => setShowCreate(true)}>Create event</Button>
                </div>
            ) : (
                <div className="grid grid-cols-3 gap-4">
                    {events.map(event => (
                        <div key={event.id} className="bg-white border border-gray-100 hover:border-violet-200 rounded-xl p-5 transition-colors group">
                            <div className="flex items-start justify-between mb-3">
                                <div className="w-10 h-10 bg-violet-50 rounded-lg flex items-center justify-center">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.8">
                                        <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
                                    </svg>
                                </div>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${event.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                                    }`}>
                                    {event.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>

                            <h3 className="font-medium text-gray-900 group-hover:text-violet-700 transition-colors mb-1">
                                {event.title}
                            </h3>
                            <p className="text-xs text-gray-400">
                                {event.event_date ?? 'No date'} · {event.location ?? 'No location'}
                            </p>

                            <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between">
                                <span className="text-xs text-gray-500">{event.total_photos} photos</span>
                                <Link
                                    href={`/events/${event.id}`}
                                    className="text-xs text-violet-600 hover:text-violet-700 font-medium"
                                >
                                    View event →
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}