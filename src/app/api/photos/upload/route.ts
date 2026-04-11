import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { uploadToR2 } from '@/lib/r2'
import sharp from 'sharp'
import { v4 as uuidv4 } from 'uuid'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const formData = await req.formData()
        const file = formData.get('file') as File
        const eventId = formData.get('event_id') as string

        if (!file || !eventId) {
            return NextResponse.json({ error: 'Missing file or event_id' }, { status: 400 })
        }

        // Verify event belongs to this photographer
        const { data: event } = await supabase
            .from('events')
            .select('id')
            .eq('id', eventId)
            .eq('photographer_id', user.id)
            .single()

        if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

        const buffer = Buffer.from(await file.arrayBuffer())
        const photoId = uuidv4()
        const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
        const basePath = `events/${eventId}/${photoId}`

        // Get image metadata
        const metadata = await sharp(buffer).metadata()

        // Calculate quality score (sharpness estimate via laplacian variance)
        const { data: grayData } = await sharp(buffer)
            .greyscale()
            .resize(200, 200, { fit: 'inside' })
            .raw()
            .toBuffer({ resolveWithObject: true })

        let qualityScore = 0.5
        if (grayData) {
            const pixels = new Uint8Array(grayData.buffer ?? grayData)
            let sum = 0, sumSq = 0
            const n = pixels.length
            for (let i = 0; i < n; i++) { sum += pixels[i]; sumSq += pixels[i] ** 2 }
            const variance = (sumSq / n) - (sum / n) ** 2
            qualityScore = Math.min(1, variance / 1000)
        }

        // Upload original (compress slightly)
        const optimized = await sharp(buffer)
            .withMetadata()
            .jpeg({ quality: 90, progressive: true })
            .toBuffer()

        const originalKey = `${basePath}/original.jpg`
        const originalUrl = await uploadToR2(optimized, originalKey, 'image/jpeg')

        // Upload thumbnail
        const thumbnail = await sharp(buffer)
            .resize(400, 400, { fit: 'cover', position: 'attention' })
            .jpeg({ quality: 75 })
            .toBuffer()

        const thumbKey = `${basePath}/thumb.jpg`
        const thumbUrl = await uploadToR2(thumbnail, thumbKey, 'image/jpeg')

        // Save to database
        const { data: photo, error } = await supabase
            .from('photos')
            .insert({
                id: photoId,
                event_id: eventId,
                storage_path: basePath,
                public_url: originalUrl,
                thumbnail_url: thumbUrl,
                file_name: file.name,
                file_size: file.size,
                width: metadata.width,
                height: metadata.height,
                quality_score: qualityScore,
                is_processed: false,
            })
            .select()
            .single()

        if (error) throw error

        // Increment event photo count
        await supabase.rpc('increment_photo_count', { event_id: eventId })

        if (photo) {
            triggerAIProcessing(photo.id, eventId, originalUrl).catch((err) =>
                console.error('AI processing trigger failed:', err)
            )
        }

        return NextResponse.json({ photo })
    } catch (err) {
        console.error('Upload error:', err)
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }
}

async function triggerAIProcessing(
    photoId: string,
    eventId: string,
    imageUrl: string
): Promise<void> {
    const aiUrl = process.env.AI_SERVICE_URL
    const secret = process.env.AI_SERVICE_SECRET

    if (!aiUrl || !secret) {
        console.warn('AI service not configured — skipping processing')
        return
    }

    const form = new FormData()
    form.append('photo_id', photoId)
    form.append('event_id', eventId)
    form.append('image_url', imageUrl)

    try {
        await fetch(`${aiUrl}/process-photo`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${secret}`,
            },
            body: form,
        })
    } catch (err) {
        console.error('AI processing request failed:', err)
    }
}