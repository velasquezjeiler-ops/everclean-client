# EverClean V21.8 — One Home + App Tab + Integrated Pro Recruitment

## Purpose
This package fixes the previous architecture issue where Home and App experiences were mixed.

## Public architecture
- `index.html`: one photo-led Home only.
- `app.html`: strong V21.1-style App landing only.
- `pro.html`: integrated EverClean Pro recruitment landing.
- `forms.html`: visible index for onboarding forms, disclosures and legal templates.
- `provider-application-form.html`: one provider application supporting multiple service capabilities.
- `provider-agreements.html`: platform/independent provider/safety/consent/profile/legal acknowledgment structure.
- `provider-verification-disclosure.html`: third-party verification disclosure.
- `stripe-payout-disclosure.html`: Stripe Connect payout disclosure.
- `terms.html`, `privacy-policy.html`, `provider-terms.html`: public legal summary pages for attorney review.

## Route rules
- Book a Service → https://everclean-client.vercel.app/new-booking
- Login → https://everclean-client.vercel.app/login
- Header Become a Pro → `pro.html`
- Start Professional Onboarding → https://everclean-client.vercel.app/pro/onboarding
- Pro Login → https://everclean-client.vercel.app/pro/login

## Pro recruitment concept
EverClean Pros are not limited to one cleaning type. They are integrated multi-service professionals who can qualify for multiple specialized service capability tracks through one onboarding process.

Required wording:
“Create one provider profile, select your service capabilities, complete onboarding, and access opportunities after approval.”

## Publicly prohibited
- No Admin links.
- No public Pro Marketplace jobs page.
- No View Pro Marketplace button.
- No public Claim Jobs or Available Jobs board.
- No SSN fields.
- No criminal-history question in public forms.
- No fee tied to insurance.
- No fake ratings or guaranteed jobs/income.

## Sensitive data rule
EverClean does not collect or store SSN directly in the marketplace database. Stripe Connect handles payout/KYC/tax/bank information. An approved verification partner handles applicable verification. EverClean stores only status/reference IDs.

## Legal status
All legal/disclosure pages are draft templates and must be reviewed by counsel before production.

## Future SEO category pages
Do not make category-specific Pro pages the core recruitment flow. The production recruitment flow is one integrated `pro.html` page where a provider applies once and selects multiple service capabilities. Category-specific Pro pages may be created later only for SEO or campaign landing purposes, and must repeat: “Apply once. Qualify for multiple service capability tracks after review.”
