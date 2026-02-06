# 11-03: DNS Configuration - Implementation Summary

## Overview
Created comprehensive DNS configuration guide for pointing r subdomain to Vercel.

## Documentation
- `docs/DEPLOYMENT.md` - DNS provider-specific instructions

## Required DNS Records

### A Records
| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | r | 76.76.21.21 | 3600 |
| A | r | 76.76.21.22 | 3600 |

Both records are required for redundancy.

## Provider-Specific Instructions

### Cloudflare
1. DNS → Records
2. Add A record
3. **Important:** Set Proxy status to "DNS only" (gray cloud)
4. Disable Cloudflare proxy for direct Vercel connection

### Route 53 (AWS)
1. Hosted Zones → alexdonega.com.br
2. Create Record Set
3. Type: A, Name: r, Alias: No
4. Add both IP addresses (separate records)

### Namecheap
1. Domain List → Manage → Advanced DNS
2. Add A Record
3. Host: r, Value: 76.76.21.21
4. Repeat for 76.76.21.22

### GoDaddy
1. DNS Management
2. Add A Record
3. Host: r, Points to: 76.76.21.21
4. TTL: 1 hour
5. Repeat for 76.76.21.22

## Verification

### Check DNS Resolution
```bash
# Basic check
dig r.alexdonega.com.br

# Check with specific DNS server
dig @8.8.8.8 r.alexdonega.com.br

# Check from multiple locations
# Use: https://www.whatsmydns.net/
```

### Check SSL
```bash
# Check certificate
openssl s_client -connect r.alexdonega.com.br:443

# Check SSL labs
# https://www.ssllabs.com/ssltest/
```

### Check HTTP
```bash
# Check response
curl -I https://r.alexdonega.com.br

# Check redirect
curl -I http://r.alexdonega.com.br
```

## Troubleshooting

### DNS Not Propagating
- Check TTL setting
- Verify correct DNS provider
- Check for conflicting records
- Clear local DNS: `ipconfig /flushdns` (Windows)

### SSL Not Provisioning
- Wait for full DNS propagation
- Check A records are correct
- Verify domain in Vercel dashboard
- Contact Vercel support if stuck

### Common Issues
- Cloudflare proxy: Must be DNS-only (gray cloud)
- Wrong IP addresses: Must use Vercel IPs
- Missing second A record: Both IPs required for redundancy
- CNAME instead of A: Must use A records for apex

## Production Checklist
- [ ] Both A records created
- [ ] DNS propagates (check with dig)
- [ ] Vercel shows "Valid Configuration"
- [ ] SSL certificate issued
- [ ] Site loads via https://r.alexdonega.com.br
- [ ] HTTP redirects to HTTPS
- [ ] All pages load correctly

## Notes
- Always use both Vercel IPs for redundancy
- Vercel IPs may change (check dashboard for current)
- DNS propagation can take 5-30 minutes (up to 24 hours)
- SSL auto-renews through Let's Encrypt
