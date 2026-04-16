---
name: Feature Flags System
description: localStorage-based feature flags in src/lib/featureFlags.ts — controls sidebar nav, page rendering, AI features. Managed from Admin > Feature Flags tab.
type: feature
---
- Feature flags stored in `localStorage` key `udyami_feature_flags`
- `src/lib/featureFlags.ts` has getFeatureFlags(), setFeatureFlags(), resetFeatureFlags()
- Sidebar filters nav items based on flags
- Index.tsx checks flags before rendering each page
- Admin panel has Feature Flags tab with toggle switches per feature
- Categories: Core Operations, Enterprise, AI Features, Advanced AI
- Agent Comm is off by default; everything else is on
