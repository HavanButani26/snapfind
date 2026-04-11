import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData()
        const eventId = formData.get('event_id') as string
        const selfie = formData.get('selfie') as File

        if (!selfie || !eventId) {
            return NextResponse.json({ error: 'Missing selfie or event_id' }, { status: 400 })
        }

        // Phase 4 will replace this with real InsightFace matching
        // For now return all event photos so the UI flow works end-to-end
        const supabase = await createClient()
        const { data: photos } = await supabase
            .from('photos')
            .select('id, public_url, thumbnail_url')
            .eq('event_id', eventId)
            .limit(20)

        return NextResponse.json({ photos: photos ?? [], matched: photos?.length ?? 0 })
    } catch (err) {
        return NextResponse.json({ error: 'Search failed' }, { status: 500 })
    }
}