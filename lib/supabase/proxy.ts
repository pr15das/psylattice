import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function redirectWithCookies(
  request: NextRequest,
  response: NextResponse,
  path: string
) {
  const url = request.nextUrl.clone();
  url.pathname = path;
  url.search = "";

  const redirectResponse = NextResponse.redirect(url);

  response.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });

  return redirectResponse;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          supabaseResponse = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Validate the signed-in user's JWT.
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

  const pathname = request.nextUrl.pathname;

  const isSelfRoute =
    pathname === "/self" || pathname.startsWith("/self/");

  const isResearcherRoute =
    pathname === "/researcher" ||
    pathname.startsWith("/researcher/");

  const isClinicianRoute =
    pathname === "/clinician" ||
    pathname.startsWith("/clinician/");

  const isProtectedRoute =
    isSelfRoute || isResearcherRoute || isClinicianRoute;

  // Public routes can continue normally.
  if (!isProtectedRoute) {
    return supabaseResponse;
  }

  // Protected route but no valid authenticated user.
  if (
    claimsError ||
    !claimsData?.claims ||
    !claimsData.claims.sub
  ) {
    return redirectWithCookies(
      request,
      supabaseResponse,
      "/signin"
    );
  }

  const userId = claimsData.claims.sub;

  // Read the user's authoritative PsyLattice role.
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("workspace_role, verification_status")
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    return redirectWithCookies(
      request,
      supabaseResponse,
      "/signin"
    );
  }

  // SELF
  if (isSelfRoute) {
    if (profile.workspace_role !== "self") {
      return redirectWithCookies(
        request,
        supabaseResponse,
        "/signin"
      );
    }

    return supabaseResponse;
  }

  // RESEARCHER
  if (isResearcherRoute) {
    if (profile.workspace_role !== "researcher") {
      return redirectWithCookies(
        request,
        supabaseResponse,
        profile.workspace_role === "self"
          ? "/self"
          : "/signin"
      );
    }

    if (profile.verification_status !== "verified") {
      return redirectWithCookies(
        request,
        supabaseResponse,
        "/pending"
      );
    }

    return supabaseResponse;
  }

  // CLINICIAN
  if (isClinicianRoute) {
    if (profile.workspace_role !== "clinician") {
      return redirectWithCookies(
        request,
        supabaseResponse,
        profile.workspace_role === "self"
          ? "/self"
          : "/signin"
      );
    }

    if (profile.verification_status !== "verified") {
      return redirectWithCookies(
        request,
        supabaseResponse,
        "/pending"
      );
    }

    return supabaseResponse;
  }

  return supabaseResponse;
}