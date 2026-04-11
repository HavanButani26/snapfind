import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { event_id } = await req.json()

        const aiUrl = process.env.AI_SERVICE_URL
        const secret = process.env.AI_SERVICE_SECRET

        const form = new FormData()
        form.append('event_id', event_id)

        const aiRes = await fetch(`${aiUrl}/batch-process`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${secret}` },
            body: form,
        })

        const result = await aiRes.json()
        return NextResponse.json(result)
    } catch (err) {
        console.error('Batch process error:', err)
        return NextResponse.json({ error: 'Batch process failed' }, { status: 500 })
    }
}