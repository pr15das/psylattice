import { createServerClient } from "@supabase/ssr";
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
  const code = requestUrl.searchParams.get("code");

  if (!code) {
    const missingCodeUrl = new URL("/signin", request.url);
    missingCodeUrl.searchParams.set("error", "missing_auth_code");
    return NextResponse.redirect(missingCodeUrl);
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

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("PsyLattice auth callback failed:", error.message);

    const failureUrl = new URL("/signin", request.url);
    failureUrl.searchParams.set("error", "auth_callback_failed");

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

  // The workshop redirect marker is one-time state. Normal future sign-ins
  // must continue to /workspace and use the ordinary workspace/onboarding flow.
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
