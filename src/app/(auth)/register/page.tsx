'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Alert } from '@/components/ui/alert'

type Step = 'form' | 'confirmation'

export default function RegisterPage() {
    const [step, setStep] = useState<Step>('form')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [registeredEmail, setRegisteredEmail] = useState('')

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        setError('')

        const formData = new FormData(e.currentTarget)
        const email = formData.get('email') as string
        const password = formData.get('password') as string
        const confirm = formData.get('confirm_password') as string
        const full_name = formData.get('full_name') as string
        const studio_name = formData.get('studio_name') as string

        if (password !== confirm) {
            setError('Passwords do not match')
            setLoading(false)
            return
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters')
            setLoading(false)
            return
        }

        const supabase = createClient()

        const { data, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name, studio_name },
                emailRedirectTo: `${window.location.origin}/auth/confirm`,
            },
        })

        if (signUpError) {
            // Supabase returns this error for duplicate emails
            if (
                signUpError.message.toLowerCase().includes('already registered') ||
                signUpError.message.toLowerCase().includes('already been registered') ||
                signUpError.message.toLowerCase().includes('user already exists') ||
                signUpError.code === 'user_already_exists'
            ) {
                setError('An account with this email already exists. Please sign in instead.')
            } else {
                setError(signUpError.message)
            }
            setLoading(false)
            return
        }

        // Supabase returns an identity with no session when confirmation is required
        // If identities is empty array, it means the email is already taken
        if (data.user && data.user.identities?.length === 0) {
            setError('An account with this email already exists. Please sign in instead.')
            setLoading(false)
            return
        }

        setRegisteredEmail(email)
        setStep('confirmation')
        setLoading(false)
    }

    if (step === 'confirmation') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="w-full max-w-md">
                    <div className="text-center mb-8">
                        <Link href="/" className="inline-flex items-center gap-2 text-violet-600 font-semibold text-xl">
                            <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
                                </svg>
                            </div>
                            SnapFind
                        </Link>
                    </div>

                    <Card>
                        <CardBody>
                            <div className="text-center py-4">
                                {/* Envelope animation */}
                                <div className="relative w-20 h-20 mx-auto mb-6">
                                    <div className="w-20 h-20 bg-violet-50 rounded-full flex items-center justify-center">
                                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.5">
                                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                            <polyline points="22,6 12,13 2,6" />
                                        </svg>
                                    </div>
                                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    </div>
                                </div>

                                <h1 className="text-xl font-semibold text-gray-900 mb-2">
                                    Check your email
                                </h1>
                                <p className="text-gray-500 text-sm mb-1">
                                    We sent a confirmation link to
                                </p>
                                <p className="text-violet-600 font-medium text-sm mb-5">
                                    {registeredEmail}
                                </p>

                                <div className="bg-gray-50 rounded-xl p-4 text-left mb-5">
                                    <p className="text-xs font-medium text-gray-700 mb-2">Next steps:</p>
                                    <div className="flex flex-col gap-2">
                                        {[
                                            'Open your email inbox',
                                            'Click the confirmation link in the email',
                                            'You\'ll be redirected to your login page',
                                        ].map((step, i) => (
                                            <div key={i} className="flex items-start gap-2.5">
                                                <div className="w-5 h-5 rounded-full bg-violet-100 text-violet-700 text-xs font-semibold flex items-center justify-center flex-shrink-0 mt-0.5">
                                                    {i + 1}
                                                </div>
                                                <p className="text-xs text-gray-600">{step}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <p className="text-xs text-gray-400 mb-4">
                                    Didn&apos;t receive the email? Check your spam folder or{' '}
                                    <button
                                        onClick={() => setStep('form')}
                                        className="text-violet-600 hover:underline font-medium"
                                    >
                                        try again
                                    </button>
                                </p>

                                <div className="border-t border-gray-100 pt-4">
                                    <p className="text-sm text-gray-500">
                                        Already confirmed?{' '}
                                        <Link href="/login" className="text-violet-600 hover:underline font-medium">
                                            Sign in
                                        </Link>
                                    </p>
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    <p className="text-center text-xs text-gray-400 mt-4">
                        The confirmation link expires in 24 hours.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-2 text-violet-600 font-semibold text-xl">
                        <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
                            </svg>
                        </div>
                        SnapFind
                    </Link>
                    <p className="text-gray-500 text-sm mt-2">Create your photographer account</p>
                </div>

                <Card>
                    <CardHeader>
                        <h1 className="text-lg font-semibold text-gray-900">Get started for free</h1>
                        <p className="text-sm text-gray-500 mt-1">No credit card required</p>
                    </CardHeader>
                    <CardBody>
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            {error && <Alert type="error" message={error} />}

                            <div className="grid grid-cols-2 gap-3">
                                <Input
                                    label="Full name"
                                    name="full_name"
                                    placeholder="Rahul Patel"
                                    required
                                    autoComplete="name"
                                />
                                <Input
                                    label="Studio name"
                                    name="studio_name"
                                    placeholder="RP Photography"
                                />
                            </div>

                            <Input
                                label="Email"
                                name="email"
                                type="email"
                                placeholder="you@example.com"
                                required
                                autoComplete="email"
                                hint="One account per email address"
                            />

                            <Input
                                label="Password"
                                name="password"
                                type="password"
                                placeholder="Min. 8 characters"
                                required
                            />

                            <Input
                                label="Confirm password"
                                name="confirm_password"
                                type="password"
                                placeholder="Repeat your password"
                                required
                            />

                            <Button type="submit" loading={loading} size="lg" className="w-full mt-2">
                                Create account
                            </Button>

                            <p className="text-center text-sm text-gray-500">
                                Already have an account?{' '}
                                <Link href="/login" className="text-violet-600 hover:underline font-medium">
                                    Sign in
                                </Link>
                            </p>
                        </form>
                    </CardBody>
                </Card>

                <p className="text-center text-xs text-gray-400 mt-6">
                    By creating an account you agree to our Terms of Service and Privacy Policy.
                </p>
            </div>
        </div>
    )
}