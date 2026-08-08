import createIntlMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const handleI18nRouting = createIntlMiddleware(routing)

export async function middleware(request: NextRequest) {
  // 0. "/" is דניאל עיצוב שיער — a standalone Hebrew page outside the
  //    next-intl locale tree. Without this, `localePrefix: 'as-needed'`
  //    rewrites "/" to "/en" and the salon page is unreachable.
  //    The LearnHub landing still lives at /en (and /es, /fr, /de, /ar).
  if (request.nextUrl.pathname === '/') return NextResponse.next()

  // 1. Run next-intl locale routing first (handles redirects, locale detection)
  const response = handleI18nRouting(request)

  // 2. Refresh Supabase session — write updated cookies onto the intl response
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // 3. Strip locale prefix for route protection checks
  const { pathname } = request.nextUrl
  const strippedPath = routing.locales.reduce(
    (p, locale) => p.replace(new RegExp(`^/${locale}(/|$)`), '/'),
    pathname
  )

  const isProtected =
    strippedPath.startsWith('/dashboard') ||
    strippedPath.includes('/learn/')

  const isAuthPage =
    strippedPath === '/login' ||
    strippedPath === '/register'

  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    const locale =
      routing.locales.find(l => pathname.startsWith(`/${l}/`) || pathname === `/${l}`) ??
      routing.defaultLocale
    url.pathname = `/${locale}/login`
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  if (isAuthPage && user) {
    const locale =
      routing.locales.find(l => pathname.startsWith(`/${l}/`) || pathname === `/${l}`) ??
      routing.defaultLocale
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
