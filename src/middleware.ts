import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const publicRoutes = [
  "/",
  "/events",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
  "/verify-certificate",
];

const authRoutes = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
];

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Check if the route is public
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // Check if the route is an auth route (login, signup, etc.)
  const isAuthRoute = authRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // Auth callback - always allow
  if (pathname.startsWith("/auth/callback")) {
    return supabaseResponse;
  }

  // If user is logged in and tries to access auth routes, redirect to dashboard
  if (user && isAuthRoute) {
    // Fetch the user's role from the profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role || "student";
    const dashboardUrl = new URL(`/${role}/dashboard`, request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  // Public routes - always accessible
  if (isPublicRoute || isAuthRoute) {
    return supabaseResponse;
  }

  // Protected routes - require authentication
  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Role-based route protection
  const isStudentRoute = pathname.startsWith("/student");
  const isOrganizerRoute = pathname.startsWith("/organizer");
  const isVolunteerRoute = pathname.startsWith("/volunteer");
  const isAdminRoute = pathname.startsWith("/admin");

  if (isStudentRoute || isOrganizerRoute || isVolunteerRoute || isAdminRoute) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role;

    // Admin routes must ALWAYS be strictly protected across all environments
    if (isAdminRoute && role !== "admin") {
      const forbiddenUrl = new URL("/forbidden", request.url);
      return NextResponse.redirect(forbiddenUrl);
    }

    // In production, enforce strict role-based access control for student/organizer/volunteer.
    if (process.env.NODE_ENV === "production") {
      if (
        (isStudentRoute && role !== "student") ||
        (isOrganizerRoute && role !== "organizer") ||
        (isVolunteerRoute && role !== "volunteer")
      ) {
        const forbiddenUrl = new URL("/forbidden", request.url);
        return NextResponse.redirect(forbiddenUrl);
      }
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images|icons|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
