# Pitfalls Research

**Domain:** Visual Review/Collaboration Tools with Multi-User, AI Agent Integration, and Stripe Billing
**Researched:** February 4, 2026
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Race Conditions in Real-Time Collaboration

**What goes wrong:**
Multiple users edit the same content simultaneously, causing lost updates, conflicting changes, or corrupted state. Users see different versions of "truth" depending on timing.

**Why it happens:**
Developers treat real-time updates like standard CRUD operations, failing to account for concurrent edits. Without proper conflict resolution strategies (CRDTs or Operational Transformation), last-write-wins becomes the de facto pattern, destroying user intent.

**How to avoid:**
- Use CRDT libraries like [Yjs](https://github.com/yjs/yjs) or [Automerge](https://github.com/automerge/automerge) for conflict-free replicated data types
- Implement operational transformation if CRDTs aren't feasible
- Never rely on simple last-write-wins for collaborative editing
- Design for offline-first with eventual consistency

**Warning signs:**
- Users report "my changes disappeared" or "I overwrote someone's work"
- Testers can reproduce data loss by editing simultaneously
- No conflict resolution strategy documented
- Using basic WebSockets without CRDT/OT layer

**Phase to address:**
Phase 1 (Foundation) - before any real-time features are built. The choice of sync architecture affects entire data model.

---

### Pitfall 2: Row-Level Security Gaps in Multi-User Systems

**What goes wrong:**
User A can access User B's notes, comments, or review sessions through API endpoints, URL manipulation, or missing permission checks. Data leaks between users or tenants.

**Why it happens:**
Developers add authentication (who is logged in) but forget authorization (what they're allowed to access). Permission checks are scattered or missing at the API/database layer. RLS policies are incomplete or not tested.

**How to avoid:**
- Implement Row-Level Security (RLS) at the database layer as defense-in-depth
- Create a centralized permission checker that all API routes use
- Test permission boundaries explicitly (User A tries to access User B's data)
- Document all resources and their permission requirements
- Use middleware/guards that enforce tenant isolation

**Warning signs:**
- No centralized permission system
- Permission checks inline in route handlers instead of reusable functions
- No tests for negative permission cases
- "It works on my machine" - single-user testing only

**Phase to address:**
Phase 1 (Foundation) - permission architecture must be designed before multi-user features. Phase 2 (Multi-User) - comprehensive testing of all permission boundaries.

---

### Pitfall 3: Stripe Webhook Signature Verification Bypassed

**What goes wrong:**
Webhook endpoints accept events without verifying Stripe signatures, allowing attackers to send fake payment_success events and unlock paid features.

**Why it happens:**
Developers skip signature verification during testing ("I'll add it later"), or verification fails due to middleware/proxy interference and gets disabled.

**How to avoid:**
- Always verify signatures using `stripe.webhooks.constructEvent()` in production
- Handle raw request bodies properly - no parsing before verification
- Be aware that CDNs/load balancers (Cloudflare) can alter payloads
- Test signature verification explicitly with both valid and invalid signatures
- Log all verification failures as security events

**Warning signs:**
- Webhook handler doesn't call signature verification
- Verification commented out or has `// TODO: add in production`
- Webhook works when called directly without Stripe headers
- No tests for fake/replay webhook events

**Phase to address:**
Phase 3 (Stripe Integration) - implement verification from day one, never defer it.

---

### Pitfall 4: OAuth Token Refresh Race Conditions

**What goes wrong:**
Multiple browser tabs or API requests simultaneously detect an expired token, triggering multiple refresh attempts. This causes token invalidation, login loops, or "refresh token already used" errors.

**Why it happens:**
Token refresh logic doesn't account for concurrent requests. When the access token expires, all in-flight requests try to refresh simultaneously, competing for the same refresh token.

**How to avoid:**
- Implement token refresh with locking/queueing (only one refresh at a time)
- Use refresh token rotation (new refresh token issued, old invalidated)
- Share token state across tabs via storage events or BroadcastChannel
- Cache the in-progress refresh promise and return it to subsequent callers

**Warning signs:**
- Users get logged out when multiple tabs are open
- Network tab shows multiple simultaneous `/token/refresh` requests
- "Refresh token already used" errors in logs
- Tokens work in single-tab testing but fail with multiple tabs

**Phase to address:**
Phase 2 (Multi-User) - OAuth integration must handle concurrency from the start.

---

### Pitfall 5: Large Component Technical Debt

**What goes wrong:**
Components grow beyond 1,000 lines (like your existing Viewer.tsx at 1,449 lines), becoming unmaintainable, difficult to test, and resistant to new features. Changes in one area break unrelated functionality.

**Why it happens:**
New features get added to existing components because "it's already there" and "it works." No refactoring budget means technical debt compounds. The file becomes a "god component" that does everything.

**How to avoid:**
- Set component size limits: 250-300 lines maximum
- Extract custom hooks for logic separation
- Break large components into 5-6 focused components
- Refactor before adding features to large components
- Use component composition over monolithic files

**Warning signs:**
- Component file >500 lines
- Diff shows changes in many unrelated areas
- "I'm afraid to touch this file" comments
- Changes consistently break unrelated features
- Hard to name what the component does (it does "everything")

**Phase to address:**
Ongoing - refactor existing large components (Viewer.tsx) in Phase 0/1. Enforce size limits for all new development.

---

### Pitfall 6: Environment Variables Not Loading in Vercel Deployments

**What goes wrong:**
Application deployed to Vercel but features fail because environment variables aren't accessible. Works locally but fails in production.

**Why it happens:**
Environment variables added but deployment not triggered. Variables scoped to wrong environment (preview vs production). Build cache not cleared. Variables accessed at build time vs runtime mismatch.

**How to avoid:**
- Always redeploy after adding/modifying environment variables
- Clear build cache after variable changes: Project Settings > Build & Development > Clear Build Cache
- Don't use quotes around variable values in Vercel UI
- Verify variables are scoped to correct environments (Production, Preview, Development)
- Check if variables need to be available at build time vs runtime
- Use `NEXT_PUBLIC_` prefix for client-side variables in Next.js

**Warning signs:**
- `undefined` when accessing `process.env.MY_VAR` in production
- Features work in local dev but fail on deploy
- Redeploy "fixes" the issue (indicates cache/timing problem)
- Different behavior between preview and production deployments

**Phase to address:**
Phase 4 (Deployment) - create deployment checklist that includes environment variable verification.

---

### Pitfall 7: Stripe Subscription Proration Logic Errors

**What goes wrong:**
Users upgrade plans and get double-charged, or downgrade and lose access immediately. Proration calculations are incorrect, causing billing disputes.

**Why it happens:**
Proration behavior (immediate, next period, none) not properly configured. Downgrade logic doesn't handle credit scenarios (amount <= 0). Cancel-at-period-end not set correctly. Webhook handling doesn't match subscription lifecycle.

**How to avoid:**
- Explicitly set proration behavior: `proration_behavior: 'create_prorations'` or `'none'`
- For downgrades: handle when prorated amount <= 0 (issue credit)
- Set `cancel_at_period_end: true` for cancellations, don't cancel immediately
- Listen to correct webhook events: `customer.subscription.updated`, `invoice.payment_succeeded`
- Test full lifecycle: upgrade, downgrade, cancel, re-subscribe
- Display prorated amounts to users before confirming changes

**Warning signs:**
- Users complain about unexpected charges
- Test invoices show weird proration line items
- Cancelled users lose access immediately
- Support team manually adjusting subscriptions frequently

**Phase to address:**
Phase 3 (Stripe Integration) - billing logic must be tested thoroughly before launch.

---

### Pitfall 8: Missing Tenant Context in Queries

**What goes wrong:**
Database queries don't filter by tenant/user ID, returning all records. When another user's data happens to be returned, it leaks. Even worse if data is aggregated/analyzed across tenants.

**Why it happens:**
Tenant context not passed to database layer. ORM queries don't include WHERE tenant_id = ?. RLS policies depend on app-level context that isn't set. JOIN queries lose tenant scope.

**How to avoid:**
- Always include tenant_id in WHERE clauses (never query without it)
- Use repository pattern that enforces tenant filtering
- Set tenant context at database connection level if supported
- Log any queries that return rows without tenant filter
- Write tests that verify tenant isolation

**Warning signs:**
- API returns more data than expected for a user
- No tenant_id in query WHERE clauses
- "SELECT * FROM table" without WHERE in codebase
- Performance improves after adding tenant filters (querying too much data)

**Phase to address:**
Phase 1 (Foundation) - tenant filtering architecture. Phase 2 (Multi-User) - comprehensive testing.

---

### Pitfall 9: Claude Code Hook JSON Validation Failures

**What goes wrong:**
Claude Code hooks fail silently, causing workflows to break. JSON validation errors prevent tools from executing properly. Agent feedback loops get stuck.

**Why it happens:**
Hook scripts return invalid JSON. Error handling doesn't capture hook failures. Prompt formatting is inconsistent. Context degradation causes malformed outputs.

**How to avoid:**
- Validate all JSON outputs in hooks before returning
- Implement proper error handling with retry logic
- Use consistent prompt formatting patterns
- Monitor context window usage - degradation causes failures
- Test hooks with various edge cases and error conditions
- Log all hook failures for debugging

**Warning signs:**
- Claude Code workflows hang or timeout
- "JSON validation failed" in logs
- Tools silently fail without error messages
- Manual intervention required to fix stuck workflows

**Phase to address:**
Phase 2 (AI Integration) - hook reliability must be tested before production use.

---

### Pitfall 10: DNS Propagation Delays Breaking Custom Domains

**What goes wrong:**
Custom domains show "Invalid Configuration" errors for hours or days. Users can't access their sites. DNS propagation takes much longer than expected.

**Why it happens:**
DNS changes can take 24-72 hours to propagate globally. Vercel shows errors immediately but DNS is still updating. Conflicting CNAME/A records. Registrar-specific delays.

**How to avoid:**
- Inform users/customers about potential 72-hour propagation window
- Remove conflicting A or CNAME records before adding new ones
- Use Vercel's DNS when possible (faster propagation)
- Verify DNS with multiple tools before reporting as broken
- Have *.vercel.app fallback available during transition
- Check Vercel's [Troubleshooting Domains](https://vercel.com/docs/domains/troubleshooting) guide

**Warning signs:**
- "Invalid Configuration" persists for >1 hour
- nslookup/dig shows different results from different locations
- Works in some browsers/regions but not others
- DNS tools show SERVFAIL or NXDOMAIN

**Phase to address:**
Phase 4 (Deployment) - include domain migration checklist with proper expectations.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| No conflict resolution for "simple" features | Ships faster | Data loss, race conditions, rewrites | Never - use CRDT from day 1 |
| Skip permission checks for MVP | Faster development | Security vulnerabilities, data leaks, rewrites | Never - build authz into foundation |
| Mock Stripe webhooks | Can test without Stripe | Production payment bugs, billing disputes | Development only - must test real webhooks before launch |
| Add features to existing large component | No upfront refactoring | Unmaintainable code, fear of changes | MVP only, must refactor immediately after |
| Single-user testing | Faster iteration | Multi-user bugs in production | Proof of concept only - must test multi-user before launch |
| Hardcode environment values | Works locally | Production failures, deployment pain | Local development only - never commit |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| **Stripe Webhooks** | Skip signature verification during testing | Verify signatures from day one, never disable |
| **Stripe Subscriptions** | Cancel immediately instead of at period end | Set `cancel_at_period_end: true`, handle via webhooks |
| **Stripe Proration** | Don't specify proration behavior | Explicitly set `proration_behavior` for all subscription changes |
| **OAuth Refresh** | Allow concurrent refresh attempts | Implement locking/queueing, reuse in-progress promise |
| **Vercel Environment Variables** | Add variables but don't redeploy | Always redeploy after variable changes |
| **Vercel Custom Domains** | Expect instant DNS propagation | Plan for 24-72 hour window, provide *.vercel.app fallback |
| **Real-Time Sync** | Use basic WebSockets without CRDT | Use Yjs or Automerge for conflict-free replication |
| **Claude Code Hooks** | Assume JSON output is always valid | Validate all JSON, implement error handling |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| **N+1 Queries with Multi-User** | Slow page loads, high DB CPU | Use data loaders, batch queries, include tenant_id in indexes | 100+ users with 1000+ items each |
| **Missing Tenant Indexes** | Queries slow down as data grows | Add composite indexes on (tenant_id, other_columns) | 10K+ rows per tenant |
| **Large Component Re-renders** | UI lag, input delay | Memoize components, useCallback/useMemo, split components | 1000+ lines in component |
| **Webhook Processing in Request Handler** | Timeouts, duplicate processing | Queue webhooks, process asynchronously, idempotency keys | 100+ webhooks/minute |
| **Real-Time Sync Overhead** | High bandwidth, slow updates | Use CRDT delta updates, compress, throttle | 10+ concurrent users editing |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| **Missing RLS Policies** | User A accesses User B's data | Implement RLS at database layer, test negative cases |
| **Webhook Signature Not Verified** | Fake payment events, feature unlock | Always verify signatures, test with fake events |
| **Refresh Token Reuse** | Stolen tokens used indefinitely | Implement token rotation, invalidate old tokens |
| **Tenant ID Enumeration** | Users guess other tenant IDs | Use UUIDs, prevent enumeration, rate limit |
| **Console Logs in Production** | Data leakage through logs | Remove/disable console.log, use proper logging |
| **Hardcoded API Keys in Code** | Keys exposed in repository | Use environment variables, git-secrets, pre-commit hooks |
| **Mixed Language in Error Messages** | Information disclosure through language differences | Standardize on single language, use translation layer |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| **No Presence Indicators** | Users overwrite each other unknowingly | Show cursors/avatars of active users |
| **Silent Sync Failures** | Users think changes saved but weren't | Show sync status, error notifications, conflict resolution UI |
| **Unexpected Charges** | Users surprised by upgrade costs | Show prorated amounts before confirming, clear pricing |
| **Immediate Access Loss** | Cancelled users lose work instantly | Grace period, read-only access, download option |
| **No Offline Mode** | Lost work when connection drops | Offline-first with CRDT sync when reconnected |
| **Mixed Language UI** | Confusion, broken trust (Portuguese hardcoded) | Internationalization from day 1, never hardcode strings |

## "Looks Done But Isn't" Checklist

- [ ] **Real-Time Collaboration:** Often missing conflict resolution — verify CRDT/OT implementation, test simultaneous edits
- [ ] **Permissions:** Often missing negative case tests — verify User A cannot access User B's data
- [ ] **Stripe Webhooks:** Often missing signature verification — verify all webhook endpoints check signatures
- [ ] **OAuth Tokens:** Often missing concurrent refresh handling — test with multiple tabs/requests
- [ ] **Environment Variables:** Often missing production verification — verify all variables load in deployed environment
- [ ] **Custom Domains:** Often missing DNS propagation expectations — plan for 24-72 hour window
- [ ] **Subscription Changes:** Often missing proration display — show users exactly what they'll be charged
- [ ] **Component Refactoring:** Often missing tests before refactoring — write tests for large components before splitting
- [ ] **Multi-User Data:** Often missing tenant filtering in all queries — audit all database calls for tenant_id
- [ ] **Error Messages:** Often missing user-friendly error handling — map technical errors to actionable messages

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| **Race Conditions (No CRDT)** | HIGH - Rewrite sync layer | Add Yjs/Automerge, migrate data model, extensive testing |
| **Missing Permission Checks** | HIGH - Add authz everywhere | Add RLS policies, centralized permission checker, comprehensive audit |
| **Webhook Verification Skipped** | MEDIUM - Add verification, rotate keys | Enable signature verification, test all webhooks, rotate webhook secrets |
| **Token Refresh Race Conditions** | MEDIUM - Add locking | Implement refresh queue, share state across tabs, add retry logic |
| **Large Components (1000+ lines)** | MEDIUM - Refactor | Extract hooks, split components, add tests, gradual refactoring |
| **Environment Variables Missing** | LOW - Redeploy with cache clear | Add variables, clear build cache, redeploy, verify in production |
| **Proration Logic Errors** | MEDIUM - Fix billing, issue credits | Fix proration settings, credit affected users, test all scenarios |
| **Tenant Context Missing** | HIGH - Audit all queries | Add tenant_id filters everywhere, implement RLS, security audit |
| **Hook JSON Failures** | MEDIUM - Add validation | Validate all outputs, error handling, retry logic, monitoring |
| **DNS Propagation Issues** | LOW - Wait, communicate | Set expectations, provide fallback URL, verify with multiple tools |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Race Conditions (No CRDT) | Phase 1: Foundation - Choose sync architecture before building | Multi-user load test with concurrent edits |
| Missing Permission Checks | Phase 1: Foundation - Design authz system | Phase 2: Comprehensive permission boundary tests |
| Webhook Verification Skipped | Phase 3: Stripe Integration - Never skip verification | Test with fake webhook events |
| Token Refresh Race Conditions | Phase 2: Multi-User - Design concurrent refresh handling | Test with multiple tabs/requests |
| Large Components | Phase 0/1: Refactor existing debt | Enforce size limits in code review |
| Environment Variables Missing | Phase 4: Deployment - Deployment checklist | Verify all features work in production |
| Proration Logic Errors | Phase 3: Stripe Integration - Test billing lifecycle | Test upgrade/downgrade/cancel scenarios |
| Tenant Context Missing | Phase 1: Foundation - Tenant filtering architecture | Audit all queries for tenant_id |
| Hook JSON Failures | Phase 2: AI Integration - Add validation from start | Test hooks with edge cases |
| DNS Propagation Issues | Phase 4: Deployment - Domain migration checklist | Document propagation expectations |

## Project-Specific Warnings (Obsidian Note Reviewer)

Based on the existing codebase analysis:

1. **Console Logs in Production**
   - Current issue: Console.log statements present
   - Risk: Data leakage, performance impact
   - Fix: Remove or replace with proper logging before multi-user launch

2. **Mixed Language UI (Portuguese)**
   - Current issue: Hardcoded Portuguese strings
   - Risk: Confusion, broken trust, limited audience
   - Fix: Implement i18n before multi-user, never hardcode strings

3. **Large Component (Viewer.tsx 1,449 lines)**
   - Current issue: Monolithic component
   - Risk: Unmaintainable, breaks easily, hard to add features
   - Fix: Refactor into smaller components before adding multi-user features

4. **Single-User Design**
   - Current issue: No permission system, no tenant isolation
   - Risk: Data leaks when multi-user added
   - Fix: Design multi-user architecture before implementation

## Sources

### Real-Time Collaboration
- [Best CRDT Libraries 2025 - Velt Blog](https://velt.dev/blog/best-crdt-libraries-real-time-data-sync)
- [CRDTs vs Operational Transformation: A Practical Guide - Hacker Noon](https://hackernoon.com/crdts-vs-operational-transformation-a-practical-guide-to-real-time-collaboration)
- [Building Real-Time Collaborative Editors: Advanced Patterns - Medium](https://medium.com/@FAANG/building-real-time-collaborative-editors-advanced-patterns-for-conflict-resolution-435b187b19b7)
- [Building Real-Time Collaborative Text Editor with CRDT - Dev.to](https://dev.to/dowerdev/building-a-real-time-collaborative-text-editor-websockets-implementation-with-crdt-data-structures-1bia)
- [Obsidian Relay Multiplayer Plugin Forum Discussion](https://forum.obsidian.md/t/relay-multiplayer-plugin-for-obsidian-collaborative-editing-and-folder-sharing/87170)

### Multi-User Security
- [Why 2026 Will Be The Year Of SaaS Breaches - Cyber Defense Magazine](https://www.cyberdefensemagazine.com/why-2026-will-be-the-year-of-saas-breaches/)
- [SaaS Security Risks 2026: Misconfigurations - Redsentry](https://redsentry.com/resources/blog/saas-security-risks-2026-misconfigurations-compliance-gaps-and-data-breach-prevention)
- [Top 10 SaaS Security Trends of 2026 - LinkedIn](https://www.linkedin.com/pulse/top-10-saas-security-trends-2026-do-control-ajx1e)
- [Common SaaS Security Risks - BetterCloud](https://www.bettercloud.com/monitor/common-saas-security-risks/)

### Stripe Integration
- [Top Mistakes to Avoid When Integrating Stripe - Dev.to](https://dev.to/softylines/top-mistakes-to-avoid-when-integrating-stripe-be8)
- [Managing Subscription Changes in Stripe Without Mistakes - Moldstud](https://moldstud.com/articles/p-how-to-effectively-manage-subscription-changes-in-stripe-and-avoid-common-pitfalls)
- [Stripe Prorations Documentation](https://docs.stripe.com/billing/subscriptions/prorations)
- [Stripe Cancel Subscriptions Documentation](https://docs.stripe.com/billing/subscriptions/cancel)
- [Stripe Change Price Documentation](https://docs.stripe.com/billing/subscriptions/change-price)
- [Prorated Billing 101 - Stripe Resources](https://stripe.com/resources/more/prorated-billing-101-what-it-is-how-it-works-and-how-to-use-it)
- [Stripe Subscription Cancellation and Prorated Refund - Medium](https://ismayilkhayredinov.medium.com/stripe-subscription-cancellation-and-prorated-refund-e4d1b58ff51e)

### OAuth & Token Management
- [Refresh Tokens on Multiple Devices - Stack Overflow](https://stackoverflow.com/questions/64903200/refresh-tokens-on-multiple-devices)
- [Refresh Access Tokens and Rotate Refresh Tokens - Okta](https://developer.okta.com/docs/guides/refresh-tokens/main/)
- [What Are Refresh Tokens - Auth0 Blog](https://auth0.com/blog/refresh-tokens-what-are-they-and-when-to-use-them/)
- [How to Handle Concurrency with OAuth Token Refreshes - Nango](https://nango.dev/blog/concurrency-with-oauth-token-refreshes)
- [Various Issues with Refresh Token Rotation - NextAuth Discussion](https://github.com/nextauthjs/next-auth/discussions/3940)

### Vercel Deployment
- [Vercel Environment Variables Documentation](https://vercel.com/docs/environment-variables)
- [Vercel System Environment Variables](https://vercel.com/docs/environment-variables/system-environment-variables)
- [Vercel Managing Environment Variables](https://vercel.com/docs/environment-variables/managing-environment-variables)
- [Vercel Adding & Configuring Custom Domains](https://vercel.com/docs/domains/working-with-domains/add-a-domain)
- [Vercel Troubleshooting Domains](https://vercel.com/docs/domains/troubleshooting)
- [Environment Variables Not Accessible in Staging - Vercel Community](https://community.vercel.com/t/environment-variables-not-accessible-in-staging/5839)
- [Environment Variable Doesn't Work in Vercel - Stack Overflow](https://stackoverflow.com/questions/72746601/environment-variable-doesnt-work-in-vercel)
- [DNS Propagation Taking Longer Than Usual - Vercel Community](https://community.vercel.com/t/dns-propagation-taking-longer-than-usual/9651)
- [Invalid Domain Configuration 72 Hours - Vercel Community](https://community.vercel.com/t/invalid-domain-configuration-72-hours-now-after-the-change/19831)

### Claude Code Integration
- [Automate Workflows with Hooks - Claude Code Docs](https://code.claude.com/docs/en/hooks-guide)
- [Claude Code Hooks Mastery - GitHub](https://github.com/disler/claude-code-hooks-mastery)
- [Claude Code Best Practices - Rosmur](https://rosmur.github.io/claudecode-best-practices/)
- [10 Production-Ready Claude Code Prompts - Medium](https://alirezarezvani.medium.com/10-production-ready-claude-code-prompts-complete-claude-code-prompting-guide-1b7bbd25369e)

### Code Review & Collaboration
- [The Art of Code Reviews: Best Practices and Common Pitfalls - Medium](https://medium.com/@hackastak/the-art-of-code-reviews-best-practices-and-common-pitfalls-b5f54e1ce7e0)
- [Common Code Review Mistakes to Avoid - Graphite](https://graphite.com/guides/common-code-review-mistakes-to-avoid)
- [Top Mistakes Your Dev Team Makes When Performing Code Reviews - Codacy](https://blog.codacy.com/top-mistakes-code-reviews)

### React Component Size
- [We Refactored 10K Lines of Code in Our Open-Source React Project - Dev.to](https://dev.to/notsidney/we-refactored-10k-lines-of-code-in-our-open-source-react-project-1a9a)
- [How Many Lines of Code Is Too Much? - LinkedIn](https://www.linkedin.com/posts/jomkit-jujaroen_softwareengineering-codequality-refactoring-activity-7381737063198543872-gt0Z)
- [Almost 6000 Line page.tsx - Reddit](https://www.reddit.com/r/react/comments/1il3b1j/almost_6000_line_pagetsx_how_will_you_react/)

### Real-Time Sync Patterns
- [Top 7 Practices for Real-Time Data Synchronization - Serverion](https://www.serverion.com/uncategorized/top-7-practices-for-real-time-data-synchronization/)
- [The Art of Staying in Sync: How Distributed Systems Avoid Race Conditions - Medium](https://medium.com/@alexglushenkov/the-art-of-staying-in-sync-how-distributed-systems-avoid-race-conditions-f59b58817e02)
- [Handling Race Condition in Distributed System - GeeksforGeeks](https://www.geeksforgeeks.org/computer-networks/handling-race-condition-in-distributed-system/)

---

*Pitfalls research for: Visual Review/Collaboration Tools with Multi-User, AI Integration, and Stripe Billing*
*Researched: February 4, 2026*
