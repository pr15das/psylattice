# Mobile notifications: local Step 3 implementation

Status: partially blocked; not deployed and migration not applied. Existing web
email dispatcher and both mobile dashboard overloads are preserved.

`supabase/migrations/20260913090000_mobile_notification_delivery.sql` adds only
device registrations and per-device delivery receipts referencing existing
study_measure_sessions. It does not add schedule definitions or generate times.
The prepare RPC is service-only and defaults policy eligibility to false.

Existing Ambulatory V3 builder/web contracts expose real prompt identities,
scheduled/expiry times, recurrence, notification/cooldown/timezone configuration.
The V3 SQL definitions and legacy `(text,integer,text)` mobile dashboard overload
are not checked into migrations. No production inspection was performed. Supply
those definitions for review before implementing a source adapter; do not
duplicate their task/prompt tables. The current projection only supports
verified measure-session-backed instances. Quiet hours, cooldowns and timing must
come from the existing authoritative scheduler before deliveries become eligible.

Authenticated routes are under api/mobile/devices, participant/notification-schedule
and notifications/[notificationId]. The optional notificationId in task completion
uses a separate RPC with an atomic postcondition: if the legacy completion picked
a different instance, a subtransaction rolls back all answer/completion writes.
The definition-only web handoff is disabled for notified tasks until proven safe.
Existing completion requests without notificationId keep their original behavior.

The device claims local delivery mode before scheduling an alarm. Remote dispatch
excludes local receipts, atomically claims pending work and rechecks source
eligibility. The HTTP v1 sender reads server-only FCM_SERVICE_ACCOUNT_JSON.
GET /api/cron/mobile-notifications uses existing CRON_SECRET and
SUPABASE_SERVICE_ROLE_KEY. No cron cadence or production job was configured.
FCM accepted does not mean device delivered. Ambiguous attempts are terminal
unknown; abandoned sending claims need operator reconciliation, never blind retry.

Tests use fake auth/RPCs, mocked sender/HTTP and SQL contract checks, with no real
push or Supabase connections. They do not execute PostgreSQL/RLS or the guarded
rollback; TEST database integration is required before enabling delivery.

The mobile repository's docs/step-3-notifications-scheduling.md and
docs/manual-setup.md contain exact schema/functions, source discovery, security,
offline/timezone behavior, Firebase setup and A–K device QA. No Step 4 work.
