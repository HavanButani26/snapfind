import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ConfirmPage({
    searchParams,
}: {
    searchParams: Promise<{ token_hash?: string; type?: string; error?: string; error_description?: string }>
}) {
    const params = await searchParams

    // If there's an error from Supabase
    if (params.error) {
        redirect(`/login?error=${encodeURIComponent(params.error_description ?? params.error)}`)
    }

    if (params.token_hash && params.type) {
        const supabase = await createClient()
        const { error } = await supabase.auth.verifyOtp({
            token_hash: params.token_hash,
            type: params.type as 'email' | 'signup',
        })

        if (!error) {
            redirect('/dashboard')
        }

        redirect(`/login?error=${encodeURIComponent('Confirmation link is invalid or has expired. Please register again.')}`)
    }

    redirect('/login')
}