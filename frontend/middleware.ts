import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const protectedRoutes = [
  '/coach',
  // Add more protected routes here as needed
  // '/profile',
  // '/battle',
  // '/headquarters',
];

// Routes that should redirect authenticated users away (like login pages)
const authRoutes = [
  '/login',
  '/register',
];

// Public routes that don't require authentication
const publicRoutes = [
  '/',
  '/about',
  '/api',
  '/debug-test',
  '/simple',
  '/simple-test', 
  '/test',
  '/test-chat',
  '/test-kitchen',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get token from cookies
  const accessToken = request.cookies.get('accessToken')?.value;
  const refreshToken = request.cookies.get('refreshToken')?.value;
  
  // Check if user is authenticated (has valid tokens)
  const isAuthenticated = !!(accessToken || refreshToken);
  
  // Check if the current path is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  // Check if the current path is an auth route
  const isAuthRoute = authRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  // Check if the current path is public
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route)
  );
  
  // Allow API routes to pass through (they handle their own auth)
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }
  
  // Redirect unauthenticated users away from protected routes
  if (isProtectedRoute && !isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    url.searchParams.set('redirectTo', pathname);
    url.searchParams.set('authRequired', 'true');
    return NextResponse.redirect(url);
  }
  
  // Redirect authenticated users away from auth routes
  if (isAuthRoute && isAuthenticated) {
    const redirectTo = request.nextUrl.searchParams.get('redirectTo') || '/coach';
    const url = request.nextUrl.clone();
    url.pathname = redirectTo;
    url.searchParams.delete('redirectTo');
    url.searchParams.delete('authRequired');
    return NextResponse.redirect(url);
  }
  
  // Allow all other requests to pass through
  return NextResponse.next();
}

// Configure which paths the middleware should run on
export const config = {
  // Match all request paths except for the ones starting with:
  // - _next/static (static files)
  // - _next/image (image optimization files)
  // - favicon.ico (favicon file)
  // - public folder files
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};