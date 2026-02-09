# Deployment Guide

This guide covers deploying the Obsidian Note Reviewer to Vercel with custom domain configuration.

## Prerequisites

- Vercel account (https://vercel.com)
- GitHub account
- Supabase project (https://supabase.com)
- Domain name (for custom domain)
- Stripe account (optional, for payments)

## Quick Start

### 1. Deploy to Vercel

1. **Push code to GitHub**
   ```bash
   git push origin main
   ```

2. **Import project in Vercel**
   - Go to https://vercel.com/new
   - Import your GitHub repository
   - Configure project settings (see below)
   - Click "Deploy"

3. **Configure environment variables**
   - Go to Project → Settings → Environment Variables
   - Add variables from `.env.example`
   - Save and redeploy

### 2. Configure Custom Domain

1. **Add domain in Vercel**
   - Go to Project → Settings → Domains
   - Enter: `r.alexdonega.com.br`
   - Click "Add"

2. **Configure DNS**
   - Add A records at your DNS provider:
     ```
     Type: A
     Name: r
     Value: 76.76.21.21
     TTL: 3600
     ```
   - Add second A record:
     ```
     Type: A
     Name: r
     Value: 76.76.21.22
     TTL: 3600
     ```

3. **Wait for DNS propagation**
   - Usually 5-30 minutes
   - Vercel will auto-detect when ready

4. **SSL certificate**
   - Automatically provisioned by Vercel
   - Wait for "Valid Configuration" status

## Project Configuration

### Vercel Settings

| Setting | Value |
|---------|-------|
| Framework Preset | Vite |
| Root Directory | `apps/portal` |
| Build Command | `bun run build` |
| Output Directory | `dist` |
| Install Command | `bun install` |

### vercel.json

The project includes a `vercel.json` file with:

- Build configuration
- Rewrites for SPA routing
- Security headers
- Cache headers for assets
- Redirects

## Environment Variables

### Required

```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Optional (Stripe)

```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
VITE_STRIPE_PRICE_PRO_MONTHLY=price_live_...
VITE_STRIPE_PRICE_PRO_YEARLY=price_live_...
VITE_STRIPE_PRICE_LIFETIME=price_live_...
```

### Adding Variables

1. Vercel Dashboard → Project → Settings → Environment Variables
2. Select environment (Production, Preview, Development)
3. Add variable name and value
4. Save
5. Trigger new deployment

See [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md) for details.

## Custom Domain Setup

### DNS Configuration

#### Required A Records

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | r | 76.76.21.21 | 3600 |
| A | r | 76.76.21.22 | 3600 |

#### DNS Provider Examples

**Cloudflare:**
1. DNS → Records
2. Add A record
3. Proxy status: DNS only (gray cloud)

**Route 53:**
1. Hosted Zones → your domain
2. Create Record Set
3. Type: A, Name: r, Value: 76.76.21.21

**Namecheap:**
1. Domain List → Manage → Advanced DNS
2. Add A Record
3. Host: r, Value: 76.76.21.21

### Verification

```bash
# Check DNS
dig r.alexdonega.com.br

# Check SSL
curl -I https://r.alexdonega.com.br

# Check response
curl https://r.alexdonega.com.br
```

## Deployment Workflow

### Production Deployments (Current)

Production deploy is executed via GitHub Actions workflow:
- Workflow: `.github/workflows/deploy.yml`
- Trigger: `workflow_dispatch` (manual)
- Targets: `all`, `marketing`, `portal`
- Environment: `production`

This prevents deploys on every push to `main`.

### Required Approval (GitHub Environment)

To enforce approval before production deploy:
1. Go to repository Settings → Environments → `production`.
2. Enable **Required reviewers**.
3. Add at least one reviewer/team.

With this protection enabled, workflow jobs targeting `production` will pause until approved.

### Manual Deployment

```bash
# GitHub UI
# Actions → Deploy → Run workflow
```

### Environment-Specific

| Environment | Deploy Trigger | URL |
|-------------|----------------|-----|
| Production | GitHub Actions `workflow_dispatch` + environment approval | `r.alexdonega.com.br` |
| Preview | Pull Request | `*.vercel.app` |
| Development | `vercel dev` | `localhost:3000` |

## Troubleshooting

### Build Failures

**Error:** Build fails in Vercel

**Solutions:**
- Check build logs for specific error
- Verify `bun install` works locally
- Check all environment variables are set
- Ensure dependencies are in `package.json`

### DNS Issues

**Error:** Domain not accessible

**Solutions:**
- Check DNS propagation: `dig r.alexdonega.com.br`
- Verify A records are correct
- Wait 24-48 hours for full propagation
- Check Vercel dashboard for domain status

### SSL Issues

**Error:** Certificate not provisioning

**Solutions:**
- Wait for DNS to propagate
- Check A records point to Vercel
- Verify domain in Vercel dashboard
- Contact Vercel support

### Environment Variables

**Error:** `VITE_` variables undefined

**Solutions:**
- Variables must start with `VITE_` for client access
- Rebuild after adding variables
- Check environment (Production vs Preview)
- Verify variable names match exactly

## Post-Deployment Checklist

- [ ] Site loads at `https://r.alexdonega.com.br`
- [ ] HTTPS works with valid SSL certificate
- [ ] All pages load correctly
- [ ] Supabase connection works
- [ ] Authentication works
- [ ] File uploads work (if using Blob storage)
- [ ] Stripe checkout works (if enabled)
- [ ] Environment variables are correct
- [ ] Preview deployments work
- [ ] Build time is reasonable (<5 minutes)

## Monitoring

### Vercel Dashboard

- **Deployments**: View deployment history
- **Analytics**: Traffic and performance
- **Logs**: Build and runtime logs
- **Settings**: Configuration

### Supabase Dashboard

- **Database**: Query and manage data
- **Authentication**: User management
- **Storage**: File management
- **Logs**: API and database logs

### Stripe Dashboard

- **Payments**: Transaction history
- **Customers**: Customer management
- **Webhooks**: Event delivery
- **Logs**: API logs

## Scaling

### Vercel

- **Hobby**: Free, 100GB bandwidth/month
- **Pro**: $20/month, 1TB bandwidth/month
- **Enterprise**: Custom

### Supabase

- **Free**: 500MB database, 1GB bandwidth
- **Pro**: $25/month, 8GB database, 50GB bandwidth
- **Enterprise**: Custom

### Stripe

- **Pay per transaction**: 2.9% + 30¢
- **No monthly fees**

## Security

### Checklist

- [ ] Environment variables are set in Vercel
- [ ] `.env` files are not in git
- [ ] Supabase RLS is enabled
- [ ] Stripe webhooks use signature verification
- [ ] HTTPS is enforced
- [ ] Security headers are set
- [ ] CSP headers are configured

### Headers

The `vercel.json` includes security headers:

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security`
- `Content-Security-Policy`

## Support

- **Vercel**: https://vercel.com/support
- **Supabase**: https://supabase.com/support
- **Stripe**: https://stripe.com/support

## See Also

- [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md)
- [Supabase Docs](https://supabase.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [Stripe Docs](https://stripe.com/docs)
