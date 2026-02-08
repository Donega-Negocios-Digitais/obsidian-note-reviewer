# External Integrations

**Analysis Date:** 2025-02-08

## APIs & External Services

### Authentication & Identity

**Supabase Auth:**
- What it's used for: Primary authentication service, user sessions, OAuth
- SDK/Client: `@supabase/supabase-js@2.89.0`
- Implementation: `packages/security/src/supabase/client.ts`
- Auth: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- Features: Session persistence in localStorage, auto-refresh token, cross-tab session detection

**GitHub OAuth:**
- What it's used for: Social login via Supabase Auth
- Implementation: `packages/security/src/supabase/oauth.ts`
- Provider: `github`
- Flow: PKCE (not implicit) for better security
- Redirect: `${window.origin}/auth/callback`

**Google OAuth:**
- What it's used for: Social login via Supabase Auth
- Implementation: `packages/security/src/supabase/oauth.ts`
- Provider: `google`
- Flow: PKCE (not implicit) for better security
- Redirect: `${window.origin}/auth/callback`

### Real-time Collaboration

**Liveblocks:**
- What it's used for: Real-time presence and cursor tracking for collaborative reviews
- SDK/Client: `@liveblocks/client@3.13.4`, `@liveblocks/react@3.13.4`
- Server SDK: `@liveblocks/node@3.13.4`
- Auth: `VITE_LIVEBLOCKS_PUBLIC_KEY`, `LIVEBLOCKS_SECRET_KEY`
- Implementation files:
  - `apps/portal/src/lib/liveblocks.ts` - Client configuration
  - `apps/portal/src/lib/liveblocks-auth.ts` - Authentication utilities
  - `apps/portal/dev-server.ts` - Development auth endpoint
  - `packages/collaboration/src/index.ts` - Core integration
- Features: Presence tracking, cursor colors, room management
- Throttle: 100ms

**Liveblocks Endpoints:**
- POST `/api/liveblocks-auth` - Room token generation (dev server)
- Authorization via: Supabase session validation

### AI Services

**Anthropic Claude API:**
- What it's used for: AI-powered annotation suggestions, content analysis
- SDK/Client: `@anthropic-ai/sdk@0.32.0`
- Implementation: `packages/ai/src/suggester.ts`
- Model: `claude-3-5-sonnet-20241022` (default)
- Auth: Client-side API key stored in localStorage (`ANTHROPIC_API_KEY`)
- Features:
  - Annotation suggestions (deletion, replacement, comment)
  - Configurable sensitivity (low/medium/high)
  - Confidence scoring (0.0-1.0)
  - Token usage tracking
  - Max 4096 tokens per response
  - Temperature: 0.3 (consistent suggestions)
- Configuration: `packages/ai/src/config.ts`
- Storage key: `obsreview-ai-config`

### Rate Limiting & Caching

**Upstash Redis:**
- What it's used for: Rate limiting for Supabase Edge Functions
- SDK/Client: `@upstash/ratelimit@2.0.7`, `@upstash/redis@1.36.0`
- Implementation: `supabase/functions/_shared/rate-limiter.ts`
- Auth: `UPSTASH_REDIS_URL`, `UPSTASH_REDIS_TOKEN`
- Rate limits:
  - Batch operations: 5 requests/minute
  - Process note: 20 requests/minute
- Fallback: In-memory sliding window for development
- Algorithm: True sliding window (not fixed window)
- Response headers: `Retry-After`, `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## Data Storage

**Databases:**
- Supabase PostgreSQL
  - Connection: `DATABASE_URL` or via Supabase client
  - Client: `@supabase/supabase-js`
  - Migrations: `supabase/migrations/`
  - Schema includes:
    - `notes` - User notes with organization isolation
    - `subscriptions` - User subscriptions and billing
    - `invoices` - Payment invoices
    - `usage_records` - Usage tracking by metric
    - `payment_methods` - Stored payment methods
    - `stripe_webhook_events` - Webhook event log
    - `subscription_history` - Subscription change history
    - `organizations` - Multi-tenant organization support
    - `users` - User profiles with roles

**File Storage:**
- Supabase Storage
  - Bucket: `avatars`
  - Implementation: `packages/security/src/supabase/storage.ts`
  - Features: User-isolated folders, public URL generation
  - Operations:
    - `uploadAvatar(userId, file)` - Upload with unique filename
    - `updateAvatarUrl(url)` - Store in user metadata
    - `getAvatarUrl(user)` - Extract from metadata
    - `deleteAvatar(url)` - Remove from storage
  - Max file size: 2MB
  - Cache control: 3600 seconds

**Caching:**
- Upstash Redis - See Rate Limiting & Caching above
- Client-side: localStorage for session data and user preferences
- IndexedDB: `idb@8.0.3` for client-side storage

## Payments & Billing

**Stripe:**
- What it's used for: Payment processing, subscription management, invoicing
- SDK/Client: `stripe` (Node.js SDK, API version `2024-11-20.acacia`)
- Auth: `STRIPE_SECRET_KEY`, `VITE_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
- Implementation files:
  - `packages/api/lib/stripe.ts` - Core Stripe service (547 lines)
  - `packages/api/routes/webhooks/stripe.ts` - Webhook handlers (491 lines)
  - `apps/portal/src/utils/stripeWebhooks.ts` - Client utilities
  - `apps/portal/src/api/subscription.ts` - Subscription CRUD

**Stripe Features:**
- Checkout sessions (subscription mode)
- Subscription management (create, update, cancel, resume)
- Plan changes with proration
- Billing portal access
- Invoice management
- Payment methods (list, detach)
- Usage records/metering
- Promotion codes and coupons
- Refunds
- Customer management

**Stripe Webhooks:**
- `checkout.session.completed` - New checkout
- `checkout.session.expired` - Checkout timeout
- `customer.subscription.created` - New subscription
- `customer.subscription.updated` - Subscription changes
- `customer.subscription.deleted` - Cancellation
- `customer.subscription.trial_will_end` - Trial ending warning
- `invoice.created` - New invoice
- `invoice.updated` - Invoice changes
- `invoice.paid` - Payment received
- `invoice.payment_failed` - Payment failed
- `invoice.payment_action_required` - Action needed
- `payment_method.attached` - New payment method
- `payment_method.detached` - Payment method removed
- `customer.updated` - Customer changes
- `customer.deleted` - Customer deletion

**Stripe Price IDs:**
- `VITE_STRIPE_PRICE_PRO_MONTHLY` - Pro monthly
- `VITE_STRIPE_PRICE_PRO_YEARLY` - Pro yearly
- `VITE_STRIPE_PRICE_LIFETIME` - One-time purchase

**Stripe Database Tables:**
- `subscriptions` - Active subscriptions with Stripe IDs
- `invoices` - Invoice records
- `payment_methods` - Stored payment methods
- `stripe_webhook_events` - Event log for debugging
- `subscription_history` - Audit trail of changes

## Application Integrations

**Obsidian (Local Vault Integration):**
- What it's used for: Read local Obsidian vaults via browser File System Access API
- Implementation: `apps/portal/src/lib/vaultIntegration.ts`
- Requirements: HTTPS or localhost, Chrome/Edge only
- Features:
  - `openVault()` - Directory picker (`showDirectoryPicker`)
  - `listVaultFiles()` - Recursive markdown file scanning
  - `readVaultFile()` - File content reading
  - `getObsidianUri()` - `obsidian://` URI scheme generation
  - `isSupported()` - Feature detection
- Storage: localStorage for vault config persistence (`obsreview-vault-config`)
- Monitored extensions: `.md` files
- Excluded directories: `.obsidian`, `node_modules`, hidden directories
- No API keys required (browser-native API)

**Claude Code (Hook Integration):**
- What it's used for: PostToolUse hook for plan file review in Obsidian
- Implementation: `apps/hook/server/obsidianHook.ts` (324 lines)
- Trigger: PostToolUse event on Write tool
- Input: JSON via stdin with `tool_input.file_path` and `tool_input.content`
- Monitored directories: `.obsidian/plans`, `Plans`, `plan` (configurable via `OBSIDIAN_PLAN_DIRS`)
- Features:
  - Ephemeral server on random port (1024-65535)
  - Approval/denial workflow with feedback
  - Inactivity timeout (25 minutes hard, 20 minutes warning)
  - Auto-browser launch (platform-specific)
  - Path validation against traversal attacks
- API endpoints:
  - `GET /api/content` - Get note content and file path
  - `POST /api/keepalive` - Reset inactivity timer
  - `POST /api/approve` - User approved plan
  - `POST /api/deny` - User requested changes
- Output: JSON to stdout for Claude Code consumption
- No external API calls

## Edge Functions

**Supabase Edge Functions (Deno):**
- Runtime: Deno via Supabase
- Location: `supabase/functions/`
- CORS: Configurable via `ALLOWED_ORIGINS` env var
- Default origins: `https://obsreview.ai`, `https://www.obsreview.ai`, `https://r.alexdonega.com.br`, `http://localhost:3000`, `http://localhost:5173`

**Functions:**
- `batch-operations` - Bulk note updates (497 lines)
  - Operations: update, delete, archive, tag
  - Max batch size: 100 notes
  - Chunk size: 10 notes per operation
  - Security: Mass assignment protection with field whitelisting
  - Allowed fields: `title`, `content`, `markdown`, `slug`, `is_public`
  - Protected fields: `id`, `org_id`, `created_by`, `created_at`, `updated_at`, `updated_by`, `share_hash`
  - Rate limit: 5 requests/minute

- `process-note` - Content processing (169 lines)
  - Operations: sanitize, markdown, extract-links, generate-summary
  - Security: HTML sanitization removes dangerous tags
  - Rate limit: 20 requests/minute

- `_shared/rate-limiter` - Rate limiting utilities (222 lines)
  - Sliding window algorithm
  - Upstash Redis integration
  - In-memory fallback for development

**Edge Functions Auth:**
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for admin operations
- Authorization header: `Bearer {token}`

## Monitoring & Observability

**Sentry:**
- What it's used for: Error tracking and performance monitoring
- SDK/Client: `@sentry/react@10.32.1`, `@sentry/vite-plugin@4.6.1`
- Implementation: Vite plugin integration
- Auth: Sentry DSN (in Vite config)
- Features: React error boundaries, performance monitoring
- Configuration: `packages/ui/lib/sentry.ts` (if exists)

**Logging:**
- Pino logger (`pino@10.1.0`, `pino-pretty@13.1.3`)
- Implementation: Server-side logging in API packages
- Console: Development logging

**Web Vitals:**
- What it's used for: Performance metrics tracking
- SDK/Client: `web-vitals@5.1.0`
- Features: CLS, FID, FCP, LCP, TTFB metrics

## CI/CD & Deployment

**Hosting:**
- Vercel (primary)
  - Config: `vercel.json`
  - Build: `bun run build`
  - Output: `apps/portal/dist`
  - Features: SPA routing, security headers, caching
  - Headers: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy

**Development Server:**
- Bun runtime (`bun.serve`)
- Location: `apps/portal/dev-server.ts` (263 lines)
- Port: 3002 (dev API)
- Endpoints:
  - `GET /api/config/list` - List configuration files
  - `GET /api/config/read` - Read configuration file
  - `POST /api/config/save` - Save configuration file
  - `POST /api/config/validate-paths` - Validate template/folder paths
  - `POST /api/liveblocks-auth` - Liveblocks authentication

**Static Assets (Marketing):**
- AWS S3 - Object storage
  - Region: us-east-1
  - Bucket: `s3://obsreview-marketing/`
  - CloudFront Distribution: E284ON0A27O2H6

**CI Pipeline:**
- GitHub Actions - Automated testing and deployment
  - Workflows: `.github/workflows/`
  - Lint/test on push
  - Security scanning with Trivy
  - Deployment on merge to main

## Environment Configuration

**Required env vars:**
```bash
# Supabase (Primary Backend)
VITE_SUPABASE_URL=                    # Supabase project URL
VITE_SUPABASE_ANON_KEY=               # Supabase anonymous key
DATABASE_URL=                          # PostgreSQL connection string (if using direct connection)

# Liveblocks (Real-time Collaboration)
VITE_LIVEBLOCKS_PUBLIC_KEY=           # Liveblocks public key
LIVEBLOCKS_SECRET_KEY=                # Liveblocks secret key (server-side)

# Stripe (Payments)
VITE_STRIPE_PUBLISHABLE_KEY=          # Stripe publishable key
STRIPE_SECRET_KEY=                    # Stripe secret key (server-side)
STRIPE_WEBHOOK_SECRET=                # Stripe webhook signing secret
VITE_STRIPE_PRICE_PRO_MONTHLY=        # Price ID for pro monthly
VITE_STRIPE_PRICE_PRO_YEARLY=         # Price ID for pro yearly
VITE_STRIPE_PRICE_LIFETIME=           # Price ID for lifetime

# Upstash (Rate Limiting - Production)
UPSTASH_REDIS_URL=                    # Upstash Redis endpoint
UPSTASH_REDIS_TOKEN=                  # Upstash Redis token

# Supabase Edge Functions
SUPABASE_URL=                         # Supabase project URL
SUPABASE_SERVICE_ROLE_KEY=            # Service role key for admin operations
SUPABASE_PROJECT_REF=                 # Project reference for CLI/MCP
SUPABASE_ACCESS_TOKEN=                # Access token for CLI/MCP

# Obsidian Hook (Optional)
OBSIDIAN_PLAN_DIRS=                   # Comma-separated plan directories

# CORS (Edge Functions)
ALLOWED_ORIGINS=                      # Additional origins beyond defaults

# Analytics (Optional)
NEXT_PUBLIC_GTM_ID=                   # Google Tag Manager
NEXT_PUBLIC_GA_ID=                    # Google Analytics 4
NEXT_PUBLIC_FACEBOOK_PIXEL_ID=        # Meta Pixel

# Development (Optional)
IMAGE_DEBUG=                          # Enable image generation debug logs
API_LOGGING=                          # Enable API logging
```

**Secrets location:**
- Local: `.env` file (gitignored)
- Production: Vercel environment variables
- Supabase: Edge function secrets (via CLI or dashboard)
- Example: `.env.example`, `supabase/functions/.env.example`

## Webhooks & Callbacks

**Incoming:**
- `/api/liveblocks-auth` - Liveblocks room token requests
- `/webhooks/stripe` - Stripe payment events (production API, not yet implemented in portal)
- Supabase auth callbacks - OAuth redirects to `/auth/callback`

**Outgoing:**
- Stripe webhooks - Sent from Stripe to configured endpoint
- Obsidian hook output - JSON to stdout for Claude Code consumption

**Claude Code Hook Output Format:**
```json
{
  "hookSpecificOutput": {
    "hookEventName": "PostToolUse",
    "result": "OBSIDIAN_PLAN_APPROVED" | "OBSIDIAN_PLAN_CHANGES_REQUESTED",
    "filePath": "...",
    "feedback": "..."  // Only for changes requested
  }
}
```

**Obsidian URI Scheme:**
- Format: `obsidian://{vaultName}/{filePath}`
- Implementation: `apps/portal/src/lib/vaultIntegration.ts`
- Purpose: Deep links into Obsidian app

## Third-Party Libraries (Not APIs)

**UI/Rendering:**
- React 19.2.3 - UI framework
- React Router DOM 7.11.0 - Client-side routing
- React Markdown 10.1.0 - Markdown rendering
- React Syntax Highlighter 16.1.0 - Code highlighting
- Mermaid 11.12.2 - Diagram rendering
- Lucide React 0.460.0 - Icons

**Content Processing:**
- DOMPurify 3.3.1 - HTML sanitization
- Isomorphic DOMPurify 2.22.0 - Universal DOMPurify
- js-yaml 4.1.1 - YAML parsing
- diff 8.0.3 - Text diffing
- highlight.js 11.11.1 - Syntax highlighting

**Storage & State:**
- idb 8.0.3 - IndexedDB wrapper
- Zustand 5.0.9 - State management
- date-fns 4.1.0 - Date utilities

**Annotation & Editing:**
- web-highlighter 0.7.4 - Text annotations
- perfect-freehand 1.2.2 - Handwriting/drawing
- react-mentions 4.4.10 - @mentions

**Internationalization:**
- i18next 25.8.4 - i18n framework
- react-i18next 16.5.4 - React bindings

**Development:**
- TypeScript 5.8.2
- Vite 6.2.0
- ESLint 9.39.2
- Vitest (testing)
- Happy DOM 20.0.11 (test environment)

## Security Integrations

**Content Security Policy:**
- Implementation: `packages/security/src/csp.ts`
- Plugin: `packages/security/src/vite-plugin-csp.ts`
- Enforced via: Vite build and dev server
- Configurable per environment
- Included in: `vercel.json` headers

**Path Validation:**
- Implementation: `apps/hook/server/pathValidation.ts`
- Purpose: Prevent path traversal attacks (CWE-22)
- Used in: Obsidian hook, dev server config operations
- Features: Normalization, allowed directory checking

**Mass Assignment Protection:**
- Implementation: `supabase/functions/batch-operations/index.ts`
- Purpose: Prevent unauthorized field modification
- Features:
  - Field whitelist for allowed updates
  - Protected field detection with logging
  - Security concern flagging

---

*Integration audit: 2025-02-08*
