# Environment Variables

This document describes all environment variables used in the Obsidian Note Reviewer application.

## Quick Start

1. Copy `.env.example` to `.env.local` for local development
2. Fill in the required values
3. For Vercel deployment, add variables in the Vercel dashboard

## Required Variables

### Supabase

| Variable | Description | Example | Where to Get |
|----------|-------------|---------|--------------|
| `VITE_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` | Supabase Dashboard → Project → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbGc...` | Supabase Dashboard → Project → Settings → API |

**Note:** These are the minimum required to run the application.

## Optional Variables

### Stripe (Payments)

| Variable | Description | Example | Where to Get |
|----------|-------------|---------|--------------|
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | `pk_test_...` or `pk_live_...` | Stripe Dashboard → Developers → API keys |
| `VITE_STRIPE_PRICE_PRO_MONTHLY` | Monthly subscription price ID | `price_xxx` | Stripe Dashboard → Products → Prices |
| `VITE_STRIPE_PRICE_PRO_YEARLY` | Yearly subscription price ID | `price_xxx` | Stripe Dashboard → Products → Prices |
| `VITE_STRIPE_PRICE_LIFETIME` | Lifetime purchase price ID | `price_xxx` | Stripe Dashboard → Products → Prices |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret | `whsec_xxx` | Stripe Dashboard → Developers → Webhooks |
| `STRIPE_SECRET_KEY` | Stripe secret key (server-only) | `sk_test_...` or `sk_live_...` | Stripe Dashboard → Developers → API keys |

### Application

| Variable | Description | Example | Default |
|----------|-------------|---------|---------|
| `VITE_APP_URL` | Application base URL | `http://localhost:5173` | (auto-detected) |

### Analytics (Optional)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_GA_TRACKING_ID` | Google Analytics ID | `G-XXXXXXXXXX` |
| `VITE_SENTRY_DSN` | Sentry DSN for error tracking | `https://xxx@sentry.io/xxx` |

## Environment-Specific Configuration

### Development (`.env.local`)
```bash
# Use Supabase local or test project
VITE_SUPABASE_URL=https://test-project.supabase.co
VITE_SUPABASE_ANON_KEY=test_anon_key

# Use Stripe test keys
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_STRIPE_PRICE_PRO_MONTHLY=price_test_...
VITE_STRIPE_PRICE_PRO_YEARLY=price_test_...
VITE_STRIPE_PRICE_LIFETIME=price_test_...

# Local development
VITE_APP_URL=http://localhost:5173
```

### Production (Vercel)
```bash
# Use production Supabase project
VITE_SUPABASE_URL=https://prod-project.supabase.co
VITE_SUPABASE_ANON_KEY=prod_anon_key

# Use Stripe live keys
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
VITE_STRIPE_PRICE_PRO_MONTHLY=price_live_...
VITE_STRIPE_PRICE_PRO_YEARLY=price_live_...
VITE_STRIPE_PRICE_LIFETIME=price_live_...

# Production URL
VITE_APP_URL=https://r.alexdonega.com.br
```

### Preview (Vercel - PR Deployments)
```bash
# Use test Supabase project (or separate preview project)
VITE_SUPABASE_URL=https://test-project.supabase.co
VITE_SUPABASE_ANON_KEY=test_anon_key

# Use Stripe test keys
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_STRIPE_PRICE_PRO_MONTHLY=price_test_...
VITE_STRIPE_PRICE_PRO_YEARLY=price_test_...
VITE_STRIPE_PRICE_LIFETIME=price_test_...

# Preview URL (auto-detected by Vercel)
VITE_APP_URL=https://your-preview-url.vercel.app
```

## Vercel Configuration

### Adding Environment Variables

1. Go to Vercel Project → Settings → Environment Variables
2. Select environment (Production, Preview, Development)
3. Add variables one by one
4. Save and redeploy

### Environment-Specific Values

Vercel allows different values for different environments:

- **Production**: Used when deploying to production
- **Preview**: Used for pull request deployments
- **Development**: Used for local development with `vercel dev`

### Sensitive Values

- Sensitive values are hidden in the UI after entry
- Never commit `.env` files to git
- Use different keys for different environments
- Rotate keys periodically

## Security Best Practices

1. **Never commit `.env` files** to version control
2. **Use test keys** in development environments
3. **Use different Supabase projects** for dev/prod
4. **Enable Row Level Security (RLS)** in Supabase
5. **Rotate API keys** regularly
6. **Monitor usage** to detect leaks
7. **Use webhook signature verification** for Stripe

## Troubleshooting

### Build Fails

**Error:** `VITE_SUPABASE_URL is not defined`

**Solution:** Add missing variable in Vercel dashboard or `.env.local`

### Supabase Connection Failed

**Error:** `Invalid API key`

**Solution:** Check that `VITE_SUPABASE_ANON_KEY` is correct

### Stripe Checkout Fails

**Error:** `No such price ID`

**Solution:** Verify price IDs are correct for the environment (test vs live)

### Preview Deployments Don't Work

**Error:** Environment variables missing in preview

**Solution:** Add variables for "Preview" environment in Vercel

## Variable Reference

### Supabase

```typescript
// Usage in code
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
```

### Stripe

```typescript
// Usage in code
const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripe = await loadStripe(stripeKey);

// Price IDs
const prices = {
  monthly: import.meta.env.VITE_STRIPE_PRICE_PRO_MONTHLY,
  yearly: import.meta.env.VITE_STRIPE_PRICE_PRO_YEARLY,
  lifetime: import.meta.env.VITE_STRIPE_PRICE_LIFETIME,
};
```

### App URL

```typescript
// Usage in code
const appUrl = import.meta.env.VITE_APP_URL;
const callbackUrl = `${appUrl}/checkout/success`;
```

## See Also

- [Supabase Documentation](https://supabase.com/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
