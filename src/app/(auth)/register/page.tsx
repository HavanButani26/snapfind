'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Alert } from '@/components/ui/alert'
import { signUp } from '@/app/actions/auth'

export default function RegisterPage() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        setError('')

        const formData = new FormData(e.currentTarget)
        const password = formData.get('password') as string
        const confirm = formData.get('confirm_password') as string

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

        const result = await signUp(formData)
        if (result?.error) {
            setError(result.error)
            setLoading(false)
        }
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
                            />

                            <Input
                                label="Password"
                                name="password"
                                type="password"
                                placeholder="Min. 8 characters"
                                required
                                hint="Use a mix of letters, numbers and symbols"
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