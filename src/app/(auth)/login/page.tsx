'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import { Alert } from '@/components/ui/alert'
import { signIn } from '@/app/actions/auth'

export default function LoginPage() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        setError('')

        const formData = new FormData(e.currentTarget)
        const result = await signIn(formData)

        if (result?.error) {
            setError(result.error)
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-2 text-violet-600 font-semibold text-xl">
                        <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
                            </svg>
                        </div>
                        SnapFind
                    </Link>
                    <p className="text-gray-500 text-sm mt-2">Welcome back</p>
                </div>

                <Card>
                    <CardHeader>
                        <h1 className="text-lg font-semibold text-gray-900">Sign in to your account</h1>
                    </CardHeader>
                    <CardBody>
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            {error && <Alert type="error" message={error} />}

                            <Input
                                label="Email"
                                name="email"
                                type="email"
                                placeholder="you@example.com"
                                required
                                autoComplete="email"
                            />

                            <div className="flex flex-col gap-1.5">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-medium text-gray-700">Password</label>
                                    <Link href="/forgot-password" className="text-xs text-violet-600 hover:underline">
                                        Forgot password?
                                    </Link>
                                </div>
                                <input
                                    name="password"
                                    type="password"
                                    placeholder="Your password"
                                    required
                                    autoComplete="current-password"
                                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                                />
                            </div>

                            <Button type="submit" loading={loading} size="lg" className="w-full mt-1">
                                Sign in
                            </Button>

                            <p className="text-center text-sm text-gray-500">
                                Don&apos;t have an account?{' '}
                                <Link href="/register" className="text-violet-600 hover:underline font-medium">
                                    Create one free
                                </Link>
                            </p>
                        </form>
                    </CardBody>
                </Card>
            </div>
        </div>
    )
}