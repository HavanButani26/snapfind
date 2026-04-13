import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await req.json()
        const { event_id } = body

        if (!event_id) {
            return NextResponse.json({ error: 'Missing event_id' }, { status: 400 })
        }

        const aiUrl = process.env.AI_SERVICE_URL
        const secret = process.env.AI_SERVICE_SECRET

        if (!aiUrl || !secret) {
            return NextResponse.json({ error: 'AI service not configured' }, { status: 503 })
        }

        // Check if AI service is ready first
        const healthRes = await fetch(`${aiUrl}/health`, {
            headers: { Authorization: `Bearer ${secret}` },
        }).catch(() => null)

        if (!healthRes?.ok) {
            return NextResponse.json(
                { error: 'AI service is unavailable. Make sure Railway is running.' },
                { status: 503 }
            )
        }

        const health = await healthRes.json()
        if (!health.models_ready) {
            return NextResponse.json(
                { error: 'AI models are still loading. Please wait 30 seconds and try again.' },
                { status: 503 }
            )
        }

        const form = new FormData()
        form.append('event_id', event_id)

        const aiRes = await fetch(`${aiUrl}/batch-process`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${secret}` },
            body: form,
        })

        if (!aiRes.ok) {
            const err = await aiRes.json().catch(() => ({ detail: 'AI processing failed' }))
            return NextResponse.json(
                { error: err.detail ?? 'AI processing failed' },
                { status: aiRes.status }
            )
        }

        const result = await aiRes.json()

        return NextResponse.json({
            processed: result.processed ?? result.results?.length ?? 0,
            results: result.results ?? [],
        })

    } catch (err) {
        console.error('Batch process error:', err)
        return NextResponse.json({ error: 'Batch process failed' }, { status: 500 })
    }
}