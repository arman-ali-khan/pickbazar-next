import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { supabaseUrl, supabaseAnonKey, isSupabaseConfigured } from '@/lib/supabase/config'

export async function middleware(request: NextRequest) {
  if (!isSupabaseConfigured) {
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  await supabase.auth.getSession()

  // Maintenance mode check
  try {
    const { data: maintenanceSetting } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'maintenance_mode')
      .single();

    const isMaintenanceMode = maintenanceSetting?.value === 'true';
    const { pathname } = request.nextUrl;

    if (isMaintenanceMode) {
      const isAllowed = 
        pathname === '/maintenance' ||
        pathname.startsWith('/admin') ||
        pathname.startsWith('/profile') ||
        pathname.startsWith('/api') ||
        pathname.startsWith('/auth');

      if (!isAllowed) {
        return NextResponse.rewrite(new URL('/maintenance', request.url));
      }
    }
  } catch (error) {
    // If settings table doesn't exist or there's an error, proceed normally.
    console.error('Middleware error checking maintenance mode:', error);
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
