import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * PsyLattice auth proxy
 *
 * IMPORTANT:
 * - Every signed-in user may enter /self, /researcher and /clinician.
 * - This file NEVER reads profiles.role.
 * - This file NEVER redirects one workspace to another workspace.
 * - Its only job is to refresh the Supabase session and keep signed-out
 *   visitors out of authenticated workspace routes.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
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
          // Keep the request-side cookie state in sync for this request.
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({
            request,
          });

          // Send refreshed Supabase auth cookies back to the browser.
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: claimsData,
    error: claimsError,
  } = await supabase.auth.getClaims();

  const isAuthenticated =
    !claimsError && Boolean(claimsData?.claims?.sub);

  if (!isAuthenticated) {
    const signInUrl = request.nextUrl.clone();

    signInUrl.pathname = "/signin";
    signInUrl.search = "";
    signInUrl.searchParams.set(
      "next",
      `${request.nextUrl.pathname}${request.nextUrl.search}`
    );

    const redirectResponse = NextResponse.redirect(signInUrl);

    redirectResponse.headers.set(
      "Cache-Control",
      "private, no-store, max-age=0"
    );

    return redirectResponse;
  }

  const userId = String(claimsData?.claims?.sub || "");

  const { data: access, error: accessError } = await supabase
    .from("psylattice_account_access")
    .select("status, suspended_until")
    .eq("user_id", userId)
    .maybeSingle();

  if (accessError) {
    console.error("PsyLattice account access check failed:", accessError.message);
    const restrictedUrl = request.nextUrl.clone();
    restrictedUrl.pathname = "/account-restricted";
    restrictedUrl.search = "?state=check_failed";
    const restrictedResponse = NextResponse.redirect(restrictedUrl);
    response.cookies.getAll().forEach((cookie) => restrictedResponse.cookies.set(cookie));
    restrictedResponse.headers.set("Cache-Control", "private, no-store, max-age=0");
    return restrictedResponse;
  } else if (access) {
    const suspendedUntil = access.suspended_until
      ? new Date(access.suspended_until).getTime()
      : null;
    const isRestricted =
      access.status === "banned" ||
      access.status === "deleting" ||
      (access.status === "suspended" &&
        suspendedUntil !== null &&
        suspendedUntil > Date.now());

    if (isRestricted) {
      const restrictedUrl = request.nextUrl.clone();
      restrictedUrl.pathname = "/account-restricted";
      restrictedUrl.search = "";
      const restrictedResponse = NextResponse.redirect(restrictedUrl);
      response.cookies.getAll().forEach((cookie) => restrictedResponse.cookies.set(cookie));
      restrictedResponse.headers.set("Cache-Control", "private, no-store, max-age=0");
      return restrictedResponse;
    }
  }

  response.headers.set(
    "Cache-Control",
    "private, no-store, max-age=0"
  );

  return response;
}

/**
 * Only authenticated application workspaces are protected here.
 *
 * /study/[token] remains public for research participants.
 * /signin and /auth/* remain outside this matcher.
 */
export const config = {
  matcher: [
    "/workspace/:path*",
    "/self/:path*",
    "/researcher/:path*",
    "/clinician/:path*",
    "/account/:path*",
    "/admin/:path*",
    "/api/admin/:path*",
  ],
};
