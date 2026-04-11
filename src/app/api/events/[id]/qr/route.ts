import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import QRCode from 'qrcode'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const supabase = await createClient()

    const { data: event } = await supabase
        .from('events')
        .select('id, title')
        .eq('id', id)
        .single()

    if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const guestUrl = `${process.env.NEXT_PUBLIC_APP_URL}/guest/${id}`

    const qrDataUrl = await QRCode.toDataURL(guestUrl, {
        width: 400,
        margin: 2,
        color: { dark: '#1e1b4b', light: '#ffffff' },
        errorCorrectionLevel: 'H',
    })

    // Save QR url back to event
    await supabase
        .from('events')
        .update({ qr_code_url: guestUrl })
        .eq('id', id)

    return NextResponse.json({ qr: qrDataUrl, url: guestUrl })
}