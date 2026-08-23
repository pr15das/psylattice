import { createServerClient } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function safeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/workspace";
  }

  return value;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;
  const next = safeNextPath(requestUrl.searchParams.get("next"));

  if (!tokenHash || !type) {
    const failureUrl = new URL("/signin", request.url);
    failureUrl.searchParams.set("error", "missing_confirmation_token");
    return NextResponse.redirect(failureUrl);
  }

  const successResponse = NextResponse.redirect(new URL(next, request.url));
  successResponse.headers.set("Cache-Control", "private, no-store, max-age=0");

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
            successResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { error } = await supabase.auth.verifyOtp({
    type,
    token_hash: tokenHash,
  });

  if (error) {
    console.error("PsyLattice email confirmation failed:", error.message);

    const failureUrl = new URL("/signin", request.url);
    failureUrl.searchParams.set("error", "email_confirmation_failed");
    return NextResponse.redirect(failureUrl);
  }

  return successResponse;
}
