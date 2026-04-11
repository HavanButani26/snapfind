import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 30
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData()
        const selfie = formData.get('selfie') as File
        const eventId = formData.get('event_id') as string
        const threshold = formData.get('threshold') ?? '0.45'
        const topK = formData.get('top_k') ?? '20'

        if (!selfie || !eventId) {
            return NextResponse.json(
                { error: 'Missing selfie or event_id' },
                { status: 400 }
            )
        }

        const aiUrl = process.env.AI_SERVICE_URL
        const secret = process.env.AI_SERVICE_SECRET

        if (!aiUrl || !secret) {
            return NextResponse.json(
                { error: 'AI service not configured' },
                { status: 503 }
            )
        }

        const aiForm = new FormData()
        aiForm.append('selfie', selfie, selfie.name)
        aiForm.append('event_id', eventId)
        aiForm.append('threshold', threshold as string)
        aiForm.append('top_k', topK as string)

        const aiRes = await fetch(`${aiUrl}/search`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${secret}` },
            body: aiForm,
        })

        if (!aiRes.ok) {
            const err = await aiRes.json().catch(() => ({ detail: 'AI service error' }))
            return NextResponse.json(
                { error: err.detail ?? 'Face search failed' },
                { status: aiRes.status }
            )
        }

        const result = await aiRes.json()
        return NextResponse.json(result)

    } catch (err) {
        console.error('Face search error:', err)
        return NextResponse.json({ error: 'Search failed' }, { status: 500 })
    }
}