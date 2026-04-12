import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
    try {
        const { photo_id, event_id, reaction = '❤️' } = await req.json()

        if (!photo_id || !event_id) {
            return NextResponse.json({ error: 'Missing photo_id or event_id' }, { status: 400 })
        }

        const supabase = await createClient()
        const { error } = await supabase
            .from('photo_reactions')
            .insert({ photo_id, event_id, reaction })

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (err) {
        return NextResponse.json({ error: 'Failed to add reaction' }, { status: 500 })
    }
}