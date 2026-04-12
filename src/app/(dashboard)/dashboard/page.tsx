import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/app/actions/auth'
import Link from 'next/link'

function greeting() {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
}

export default async function DashboardPage() {
    const supabase = await createClient()
    const profile = await getProfile()

    const [
        { count: totalEvents },
        { count: totalPhotos },
        { count: totalFaces },
        { count: totalReactions },
        { data: recentEvents },
        { data: recentQuotations },
    ] = await Promise.all([
        supabase.from('events').select('*', { count: 'exact', head: true }).eq('photographer_id', profile!.id),
        supabase.from('photos').select('*, events!inner(photographer_id)', { count: 'exact', head: true }).eq('events.photographer_id', profile!.id),
        supabase.from('face_embeddings').select('*, events!inner(photographer_id)', { count: 'exact', head: true }).eq('events.photographer_id', profile!.id),
        supabase.from('photo_reactions').select('*, events!inner(photographer_id)', { count: 'exact', head: true }).eq('events.photographer_id', profile!.id),
        supabase.from('events').select('*').eq('photographer_id', profile!.id).order('created_at', { ascending: false }).limit(4),
        supabase.from('quotations').select('*, clients(name)').eq('photographer_id', profile!.id).order('created_at', { ascending: false }).limit(4),
    ])

    const stats = [
        { label: 'Total events', value: totalEvents ?? 0, color: 'text-gray-900' },
        { label: 'Photos uploaded', value: totalPhotos ?? 0, color: 'text-gray-900' },
        { label: 'Faces indexed', value: totalFaces ?? 0, color: 'text-violet-600' },
        { label: 'Guest reactions', value: totalReactions ?? 0, color: 'text-pink-600' },
    ]

    const STATUS_COLORS: Record<string, string> = {
        draft: 'bg-gray-100 text-gray-600',
        sent: 'bg-blue-50 text-blue-700',
        accepted: 'bg-green-50 text-green-700',
        paid: 'bg-violet-50 text-violet-700',
        rejected: 'bg-red-50 text-red-500',
    }

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-semibold text-gray-900">
                    {greeting()}, {profile?.full_name?.split(' ')[0]} 👋
                </h1>
                <p className="text-gray-500 text-sm mt-1">
                    {profile?.studio_name ? `${profile.studio_name} · ` : ''}Here&apos;s your overview
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-8">
                {stats.map(s => (
                    <div key={s.label} className="bg-white border border-gray-100 rounded-xl p-5">
                        <div className={`text-2xl font-semibold ${s.color}`}>{s.value.toLocaleString()}</div>
                        <div className="text-sm text-gray-500 mt-1">{s.label}</div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-2 gap-6">
                {/* Recent events */}
                <div className="bg-white border border-gray-100 rounded-xl">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
                        <h2 className="font-medium text-gray-900">Recent events</h2>
                        <Link href="/events" className="text-sm text-violet-600 hover:underline">View all</Link>
                    </div>
                    {!recentEvents?.length ? (
                        <div className="text-center py-10">
                            <p className="text-gray-400 text-sm">No events yet</p>
                            <Link href="/events" className="text-violet-600 text-sm mt-2 inline-block">Create one →</Link>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {recentEvents.map(event => (
                                <Link key={event.id} href={`/events/${event.id}`}
                                    className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50 transition-colors">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{event.title}</p>
                                        <p className="text-xs text-gray-400">{event.total_photos} photos</p>
                                    </div>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${event.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                        {event.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent quotations */}
                <div className="bg-white border border-gray-100 rounded-xl">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
                        <h2 className="font-medium text-gray-900">Recent quotations</h2>
                        <Link href="/billing" className="text-sm text-violet-600 hover:underline">View all</Link>
                    </div>
                    {!recentQuotations?.length ? (
                        <div className="text-center py-10">
                            <p className="text-gray-400 text-sm">No quotations yet</p>
                            <Link href="/billing" className="text-violet-600 text-sm mt-2 inline-block">Create one →</Link>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {recentQuotations.map(q => (
                                <div key={q.id} className="flex items-center justify-between px-6 py-3.5">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{q.title}</p>
                                        <p className="text-xs text-gray-400">
                                            {(q as any).clients?.name ?? 'No client'} · {q.quote_number}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-gray-900">₹{Number(q.total).toLocaleString('en-IN')}</p>
                                        <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[q.status]}`}>
                                            {q.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Quick actions */}
            <div className="mt-6 grid grid-cols-4 gap-3">
                {[
                    { href: '/events', label: 'New event', icon: 'M3 4h18v18H3V4zM16 2v4M8 2v4M3 10h18' },
                    { href: '/billing', label: 'New quotation', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
                    { href: '/events', label: 'Upload photos', icon: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12' },
                    { href: '/events', label: 'View galleries', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
                ].map(a => (
                    <Link key={a.href + a.label} href={a.href}
                        className="bg-white border border-gray-100 hover:border-violet-200 rounded-xl p-4 flex items-center gap-3 transition-colors group">
                        <div className="w-9 h-9 bg-violet-50 group-hover:bg-violet-100 rounded-lg flex items-center justify-center transition-colors">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.8">
                                <path d={a.icon} />
                            </svg>
                        </div>
                        <span className="text-sm font-medium text-gray-700 group-hover:text-violet-700 transition-colors">{a.label}</span>
                    </Link>
                ))}
            </div>
        </div>
    )
}