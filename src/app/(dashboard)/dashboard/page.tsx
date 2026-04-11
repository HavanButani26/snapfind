import { createClient } from '@/lib/supabase/server'
import { getProfile } from '@/app/actions/auth'
import Link from 'next/link'

export default async function DashboardPage() {
    const supabase = await createClient()
    const profile = await getProfile()

    const { data: events } = await supabase
        .from('events')
        .select('*')
        .eq('photographer_id', profile!.id)
        .order('created_at', { ascending: false })
        .limit(5)

    const { count: totalEvents } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('photographer_id', profile!.id)

    const { count: totalPhotos } = await supabase
        .from('photos')
        .select('*, events!inner(photographer_id)', { count: 'exact', head: true })
        .eq('events.photographer_id', profile!.id)

    const stats = [
        { label: 'Total events', value: totalEvents ?? 0 },
        { label: 'Total photos', value: totalPhotos ?? 0 },
        { label: 'Active events', value: events?.filter(e => e.is_active).length ?? 0 },
        { label: 'Faces indexed', value: '—' },
    ]

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-semibold text-gray-900">
                    Good morning, {profile?.full_name?.split(' ')[0]} 👋
                </h1>
                <p className="text-gray-500 text-sm mt-1">
                    Here&apos;s what&apos;s happening with your events
                </p>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-8">
                {stats.map((s) => (
                    <div key={s.label} className="bg-white border border-gray-100 rounded-xl p-5">
                        <div className="text-2xl font-semibold text-gray-900">{s.value}</div>
                        <div className="text-sm text-gray-500 mt-1">{s.label}</div>
                    </div>
                ))}
            </div>

            <div className="bg-white border border-gray-100 rounded-xl">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="font-medium text-gray-900">Recent events</h2>
                    <Link href="/events" className="text-sm text-violet-600 hover:underline">
                        View all
                    </Link>
                </div>

                {!events || events.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-12 h-12 bg-gray-100 rounded-xl mx-auto flex items-center justify-center mb-4">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
                                <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
                            </svg>
                        </div>
                        <p className="text-gray-500 text-sm">No events yet</p>
                        <Link
                            href="/events"
                            className="inline-block mt-3 px-4 py-2 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-700 transition-colors"
                        >
                            Create your first event
                        </Link>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {events.map((event) => (
                            <Link
                                key={event.id}
                                href={`/events/${event.id}`}
                                className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
                            >
                                <div>
                                    <p className="text-sm font-medium text-gray-900">{event.title}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        {event.event_date ?? 'No date set'} · {event.total_photos} photos
                                    </p>
                                </div>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${event.is_active
                                        ? 'bg-green-50 text-green-700'
                                        : 'bg-gray-100 text-gray-500'
                                    }`}>
                                    {event.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}