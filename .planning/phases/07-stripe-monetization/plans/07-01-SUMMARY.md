07-01: Freemium Tier System - Implementation Summary

## Overview
Implemented tier system that limits free users to individual use while enabling unlimited collaborators for Pro subscribers.

## Files Created
- `packages/collaboration/src/types/tier.ts` (180 lines)
- `apps/portal/src/hooks/useSubscription.ts` (175 lines)
- `apps/portal/src/components/UpgradePrompt.tsx` (280 lines)

## Core Features

### Tier Types
```typescript
export type SubscriptionTier = 'free' | 'pro';
export type SubscriptionType = 'monthly' | 'yearly' | 'lifetime';
export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'incomplete' | 'trialing';
```

### Tier Limits
- **Free**: 0 collaborators, 0 shared documents, no advanced features
- **Pro**: Unlimited collaborators, unlimited shared documents, all features

### useSubscription Hook
- `subscription`: Full subscription object from database
- `tier`: Current tier ('free' | 'pro')
- `isPro`/`isFree`: Convenience booleans
- `canAddCollaborators`: Permission check for collaboration
- `limits`: TierLimits object
- `refresh`: Manually refresh subscription data
- Real-time sync via Supabase subscription

### UpgradePrompt Components
- **UpgradePrompt**: Full modal with feature list and pricing preview
- **UpgradeBanner**: Inline banner for smaller footprint
- **FeatureLock**: Overlay wrapper for locked features

## Helper Functions
- `hasTierFeature()`: Check specific feature permission
- `canAddCollaborators()`: Verify collaboration access
- `getTierDisplayName()`: Portuguese display names
- `getStatusDisplayName()`: Portuguese status names

## Next Steps
- Integrate with Supabase subscriptions table (10-05)
- Add upgrade prompts to PermissionSettings
- FeatureLock wrap collaboration features
