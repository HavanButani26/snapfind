import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 30
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { event_id, person_photo_ids, top_k = 20 } = body

        if (!event_id || !person_photo_ids || person_photo_ids.length < 2) {
            return NextResponse.json(
                { error: 'Provide event_id and at least 2 person_photo_ids' },
                { status: 400 }
            )
        }

        const aiUrl = process.env.AI_SERVICE_URL
        const secret = process.env.AI_SERVICE_SECRET

        const aiRes = await fetch(`${aiUrl}/group-search`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${secret}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ event_id, person_photo_ids, top_k }),
        })

        const result = await aiRes.json()

        if (!aiRes.ok) {
            return NextResponse.json(
                { error: result.detail ?? 'Group search failed' },
                { status: aiRes.status }
            )
        }

        return NextResponse.json(result)
    } catch (err) {
        console.error('Group search error:', err)
        return NextResponse.json({ error: 'Group search failed' }, { status: 500 })
    }
}