import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Public routes
  const publicRoutes = ['/login', '/register', '/'];
  const isPublicRoute = publicRoutes.includes(request.nextUrl.pathname);

  // Redirect ke login jika belum auth dan akses protected route
  if (!user && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Jika sudah login, redirect dari landing/auth pages ke dashboard
  if (user) {
    // Ambil role dari user metadata (tidak perlu query DB, lebih cepat)
    let role = user.user_metadata?.role as string;

    // Fallback: jika role tidak ada di metadata, query dari database dan sync ke metadata
    if (!role) {
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();
      
      role = userData?.role || 'customer';

      // Sync role ke metadata untuk next time (agar tidak perlu query DB lagi)
      if (userData?.role) {
        await supabase.auth.updateUser({
          data: { role: userData.role }
        });
      }
    }

    // Validasi role
    const validRoles = ['customer', 'admin', 'mechanic', 'owner'];
    if (!validRoles.includes(role)) {
      role = 'customer';
    }

    const path = request.nextUrl.pathname;

    // Redirect dari landing page atau auth pages ke dashboard sesuai role
    if (path === '/' || path === '/login' || path === '/register') {
      return NextResponse.redirect(new URL(`/${role}`, request.url));
    }

    // Role-based routing protection
    if (path.startsWith('/customer') && role !== 'customer') {
      return NextResponse.redirect(new URL(`/${role}`, request.url));
    }
    if (path.startsWith('/admin') && role !== 'admin') {
      return NextResponse.redirect(new URL(`/${role}`, request.url));
    }
    if (path.startsWith('/mechanic') && role !== 'mechanic') {
      return NextResponse.redirect(new URL(`/${role}`, request.url));
    }
    if (path.startsWith('/owner') && role !== 'owner') {
      return NextResponse.redirect(new URL(`/${role}`, request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
