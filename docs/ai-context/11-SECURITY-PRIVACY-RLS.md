# 11 — Security, Privacy, RLS, and Sensitive Data Rules

## Security posture

PsyLattice spans research, self-monitoring, and clinical workflows. Treat user records as sensitive by default.

Security is not a UI feature; it must be enforced server/database-side.

## Supabase RLS

Strict RLS is part of the core architecture.

General pattern:

- authenticated researcher-owned rows use `owner_user_id = auth.uid()`;
- participant/public routes use constrained token/session/RPC logic;
- clinical access should be derived from explicit relationships/permissions;
- system templates can have null/system ownership but must not allow arbitrary mutation.

Never disable RLS as a production “fix.”

## Grants + RLS

Both are required.

Checklist for a new table:

```text
CREATE TABLE
INDEXES / CONSTRAINTS
ENABLE RLS
CREATE POLICIES
GRANT SELECT/INSERT/UPDATE/DELETE as needed
TEST AS APP ROLE
```

The Cognitive Battery Builder permission bug is the canonical reminder: owner RLS policies were correct, but the authenticated role lacked table privileges, causing `permission denied for table cognitive_batteries`.

## Security-definer functions

Use only when a public/participant workflow genuinely requires controlled privileged operations.

Functions should:

- use a safe search_path;
- validate `auth.uid()` or participant/session token context;
- verify IDs belong to the current study/user;
- avoid user-controlled dynamic SQL;
- return the minimum necessary data.

## Secrets

Never place in client code, Git, or AI context:

- Supabase service-role key;
- OpenAI key;
- Vercel/Render deploy token;
- database password;
- JWT signing secret;
- OAuth secret;
- SMTP/API mail secret;
- password reset tokens;
- production webhook secrets.

Public Supabase anon keys may be client-visible by design, but service-role keys are never client-visible.

## AI document/data privacy

### Thesis Builder

Writing AI may read the current paper only after explicit user permission via the editor toggle.

Turning access on is a conscious event and should be visibly indicated. Turning it off must stop paper transmission.

Do not silently send a paper merely because the AI panel is open.

### Research AI

Research AI should receive the study/data needed for the requested analysis, not indiscriminately all direct identifiers.

### Clinical/Self

Minimize sensitive context. Do not log full clinical notes or private self-assessment content in debug logs unless absolutely necessary and explicitly controlled.

## Direct identifiers in export

Pseudonymous export is the safe default.

Direct identifiers should require explicit researcher confirmation and should not be included in broad analysis exports accidentally.

## Production support

The support engineer must use least privilege.

Never:

- ask a user to send a password;
- view a user’s private notes/paper/clinical data simply to prove access;
- edit a participant’s research response to resolve a UI issue;
- share screenshots containing participant identities in public tickets;
- copy production records into ChatGPT without sanitization.

When reproducing bugs, use test accounts/test studies whenever possible.

## Regulatory/compliance direction

Earlier architecture planning emphasized EU hosting/security review before using real health/clinical data at scale. Treat privacy/compliance as an ongoing product requirement rather than assuming the current implementation alone satisfies every jurisdiction.

Do not make unsupported compliance claims such as “HIPAA compliant” or “GDPR compliant” without formal review/evidence.
