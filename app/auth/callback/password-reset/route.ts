import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (!code) {
    const failureUrl = new URL("/signin", request.url);
    failureUrl.searchParams.set("error", "invalid_password_reset_link");

    return NextResponse.redirect(failureUrl);
  }

  const response = NextResponse.redirect(
    new URL("/reset-password", request.url)
  );

  response.headers.set(
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
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error(
      "PsyLattice password-reset callback failed:",
      error.message
    );

    const failureUrl = new URL("/signin", request.url);
    failureUrl.searchParams.set("error", "password_reset_callback_failed");

    return NextResponse.redirect(failureUrl);
  }

  return response;
}