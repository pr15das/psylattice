import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Supabase PKCE callback.
 *
 * After a successful auth-code exchange every user goes to /workspace.
 * There is deliberately NO profile.role lookup here.
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (!code) {
    const missingCodeUrl = new URL("/signin", request.url);
    missingCodeUrl.searchParams.set(
      "error",
      "missing_auth_code"
    );

    return NextResponse.redirect(missingCodeUrl);
  }

  const successResponse = NextResponse.redirect(
    new URL("/workspace", request.url)
  );

  successResponse.headers.set(
    "Cache-Control",
    "private, no-store, max-age=0"
  );

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(
            ({ name, value, options }) => {
              successResponse.cookies.set(
                name,
                value,
                options
              );
            }
          );
        },
      },
    }
  );

  const { error } =
    await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error(
      "PsyLattice auth callback failed:",
      error.message
    );

    const failureUrl = new URL("/signin", request.url);
    failureUrl.searchParams.set(
      "error",
      "auth_callback_failed"
    );

    return NextResponse.redirect(failureUrl);
  }

  return successResponse;
}