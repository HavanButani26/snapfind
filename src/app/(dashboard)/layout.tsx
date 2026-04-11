import { redirect } from 'next/navigation'
import { getProfile } from '@/app/actions/auth'
import { Sidebar } from '@/components/shared/sidebar'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const profile = await getProfile()
    if (!profile) redirect('/login')

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar profile={profile} />
            <main className="flex-1 ml-64 p-8">
                {children}
            </main>
        </div>
    )
}