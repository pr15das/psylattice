import { createServerClient } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const DEFAULT_AFTER_AUTH = "/workspace";
const WORKSHOP_REGISTRATION_PATH = "/workshops/register";
const WORKSHOP_AUTH_ORIGIN = "workshop_registration";

type PendingCookie = {
  name: string;
  value: string;
  options?: Parameters<NextResponse["cookies"]["set"]>[2];
};

function safeInternalPath(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return null;

  return trimmed;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;

  if (!tokenHash || !type) {
    const failureUrl = new URL("/signin", request.url);
    failureUrl.searchParams.set("error", "missing_confirmation_token");
    return NextResponse.redirect(failureUrl);
  }

  const pendingCookies: PendingCookie[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach((cookie) => {
            pendingCookies.push(cookie as PendingCookie);
          });
        },
      },
    },
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const explicitNext = safeInternalPath(requestUrl.searchParams.get("next"));
  const metadataNext = safeInternalPath(user?.user_metadata?.post_auth_next);

  const cameFromWorkshop =
    user?.user_metadata?.auth_origin === WORKSHOP_AUTH_ORIGIN &&
    metadataNext === WORKSHOP_REGISTRATION_PATH;

  const nextPath =
    explicitNext ||
    (cameFromWorkshop ? WORKSHOP_REGISTRATION_PATH : null) ||
    DEFAULT_AFTER_AUTH;

  // Consume the workshop-only redirect marker so future normal sign-ins
  // continue through /workspace and onboarding exactly as before.
  if (cameFromWorkshop) {
    const currentMetadata = user?.user_metadata || {};

    await supabase.auth.updateUser({
      data: {
        ...currentMetadata,
        post_auth_next: null,
        auth_origin: null,
      },
    });
  }

  const successResponse = NextResponse.redirect(new URL(nextPath, request.url));

  pendingCookies.forEach(({ name, value, options }) => {
    successResponse.cookies.set(name, value, options);
  });

  successResponse.headers.set(
    "Cache-Control",
    "private, no-store, max-age=0",
  );

  return successResponse;
}
