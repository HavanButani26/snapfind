import { createClient } from '@/lib/supabase/server'
import GuestClient from './GuestClient'

export default async function GuestPage({
    params,
}: {
    params: Promise<{ eventId: string }>
}) {
    const { eventId } = await params
    const supabase = await createClient()

    const { data: event } = await supabase
        .from('events')
        .select('id, title, is_active')
        .eq('id', eventId)
        .single()

    if (!event || !event.is_active) {
        return (
            <div className="min-h-screen bg-linear-to-b from-violet-50 to-white flex items-center justify-center px-4">
                <div className="text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto flex items-center justify-center mb-4">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
                            <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
                        </svg>
                    </div>
                    <h1 className="text-xl font-semibold text-gray-900 mb-2">Event not available</h1>
                    <p className="text-gray-400 text-sm">This event is inactive or doesn&apos;t exist.</p>
                </div>
            </div>
        )
    }

    return <GuestClient eventId={eventId} eventTitle={event.title} />
}