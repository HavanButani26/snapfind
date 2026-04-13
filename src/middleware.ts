import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return request.cookies.getAll() },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({ request })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()

    const pathname = request.nextUrl.pathname

    // Routes only for guests (not logged in)
    const authRoutes = ['/login', '/register', '/forgot-password']
    const isAuthRoute = authRoutes.some(r => pathname.startsWith(r))

    // Routes that require login
    const protectedPaths = ['/dashboard', '/events', '/photos', '/clients', '/billing']
    const isProtected = protectedPaths.some(p => pathname.startsWith(p))

    // Not logged in → trying to access protected page → send to login
    if (!user && isProtected) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // Logged in → trying to access auth pages → send to dashboard
    if (user && isAuthRoute) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return supabaseResponse
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|api|auth/confirm|guest|wall).*)'],
}