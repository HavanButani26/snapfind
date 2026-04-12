'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { signOut } from '@/app/actions/auth'
import type { Profile } from '@/types'

interface SidebarProps {
    profile: Profile
}

const navItems = [
    {
        label: 'Dashboard',
        href: '/dashboard',
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
        ),
    },
    {
        label: 'Events',
        href: '/events',
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
        ),
    },
    {
        label: 'Photos',
        href: '/photos',
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" />
            </svg>
        ),
    },
    {
        label: 'Clients',
        href: '/clients',
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
            </svg>
        ),
    },
    {
        label: 'Billing',
        href: '/billing',
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" />
            </svg>
        ),
    },
]

export function Sidebar({ profile }: SidebarProps) {
    const pathname = usePathname()

    return (
        <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-100 flex flex-col">
            <div className="p-5 border-b border-gray-100">
                <Link href="/dashboard" className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
                        </svg>
                    </div>
                    <span className="font-semibold text-gray-900">SnapFind</span>
                </Link>
            </div>

            <nav className="flex-1 p-4 flex flex-col gap-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                                isActive
                                    ? 'bg-violet-50 text-violet-700'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            )}
                        >
                            <span className={isActive ? 'text-violet-600' : 'text-gray-400'}>
                                {item.icon}
                            </span>
                            {item.label}
                        </Link>
                    )
                })}
            </nav>

            <div className="p-4 border-t border-gray-100">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-semibold text-sm">
                        {profile.full_name?.charAt(0).toUpperCase() ?? 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{profile.full_name ?? 'Photographer'}</p>
                        <p className="text-xs text-gray-400 truncate">{profile.email}</p>
                    </div>
                </div>
                <form action={signOut}>
                    <button
                        type="submit"
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
                        </svg>
                        Sign out
                    </button>
                </form>
            </div>
        </aside>
    )
}