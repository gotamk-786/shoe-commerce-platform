# Thrifty Shoes Issue Scan

Scanned on: 2026-03-08

This file documents the current issues reported by the user plus additional issues found during a code scan of the project.

## High Priority

### 1. Checkout `Place order` shows `Unauthorized`
- Status: Confirmed from code
- User impact: Customer cannot complete checkout unless auth state is present and valid.
- Evidence:
  - `backend/src/routes/orders.ts:198` protects order creation with `requireUser`.
  - `backend/src/middleware/jwt-auth.ts:33` returns `401 Unauthorized` when no bearer token is present.
  - `src/app/checkout/page.tsx:69` calls `createOrder(...)` directly.
  - `src/app/checkout/page.tsx` has no login guard or redirect before submit.
- Likely cause:
  - Checkout UI allows unauthenticated users to reach final submit.
  - API requires JWT, so backend rejects the request.
- Fix direction:
  - Add auth guard on checkout page.
  - Redirect guest users to login before entering checkout or before final submit.
  - Show a friendly message instead of raw `Unauthorized`.

### 2. Checkout `Back` button inside form likely submits instead of going back
- Status: Confirmed from code
- User impact: Back action can misfire and trigger submit behavior because the button is inside a form.
- Evidence:
  - `src/app/checkout/page.tsx:197` renders the `Back` button inside `<form>`.
  - `src/components/ui/button.tsx:35` renders `<motion.button {...props}>` without a safe default `type="button"`.
- Likely cause:
  - Native button default type inside forms is `submit`.
- Fix direction:
  - Set `type="button"` by default in the shared button component, or explicitly set `type="button"` on non-submit buttons.

### 3. Slow page loads across project
- Status: Confirmed from architecture/code
- User impact: Opening pages takes too long, especially on first load or after idle time.
- Evidence:
  - `src/lib/api.ts:22` uses `https://shoe-commerce-platform.onrender.com` as default API base.
  - Render-hosted backends commonly introduce cold-start delay on inactive services.
  - `src/app/account/page.tsx:134` starts client-side loading, then fetches many resources after render.
  - `src/app/account/page.tsx:154` to `src/app/account/page.tsx:159` fetches orders, addresses, payment methods, notifications, returns, and activity together after mount.
  - Large client-heavy files increase hydration cost:
    - `src/app/account/page.tsx` ~1164 lines
    - `src/app/admin/products/page.tsx` ~694 lines
    - `src/lib/api.ts` ~795 lines
- Likely causes:
  - Heavy client-side rendering and post-mount data fetching.
  - Remote backend latency.
  - Large page components doing too much at once.
- Fix direction:
  - Move public/product/account data fetching to server components where possible.
  - Add route-level loading states and split large pages into smaller sections/components.
  - Avoid defaulting production users to a sleeping backend.
  - Audit images and API waterfalls.

## Medium Priority

### 4. Navigation uses full page reloads instead of app-router navigation
- Status: Confirmed from code
- User impact: Slower transitions, state loss risk, rough UX.
- Evidence:
  - `src/app/account/page.tsx:524`
  - `src/app/account/page.tsx:1134`
  - `src/app/wishlist/page.tsx:35`
  - `src/app/admin/orders/page.tsx:81`
  - `src/app/admin/orders/[id]/page.tsx:88`
- Likely cause:
  - Multiple places use `window.location.href` instead of `router.push()` or `Link`.
- Fix direction:
  - Replace `window.location.href` with Next navigation APIs.

### 5. Checkout shipping payload is incomplete/inconsistent
- Status: Confirmed from code
- User impact: Customer contact data is incomplete and notification features may silently fail.
- Evidence:
  - `src/app/checkout/page.tsx:11` to `src/app/checkout/page.tsx:17` shipping type does not include `phone`.
  - `backend/src/routes/orders.ts:437` tries to read `payload.shipping?.phone` for SMS.
- Likely cause:
  - Frontend shipping form and backend order flow are out of sync.
- Fix direction:
  - Add phone field to checkout if SMS confirmation is intended.
  - Use a shared validated order payload contract.

### 6. Payment settings fetch fails silently
- Status: Confirmed from code
- User impact: Checkout can behave unexpectedly with no visible error when payment config API fails.
- Evidence:
  - `src/app/checkout/page.tsx:48` to `src/app/checkout/page.tsx:51` swallows errors with `.catch(() => {})`.
- Fix direction:
  - Surface payment-settings load errors or use safe defaults with a visible warning.

### 7. Metadata is hardcoded to localhost
- Status: Confirmed from code
- User impact: Wrong metadata/open graph base in production.
- Evidence:
  - `src/app/layout.tsx:19` sets `metadataBase` to `http://localhost:3000`.
- Fix direction:
  - Read site URL from env and use production-safe metadata.

## UI / UX Issues

### 8. UI consistency pass is needed
- Status: Confirmed from scan, broad issue
- User impact: Some areas feel inconsistent and overloaded.
- Evidence:
  - Account page is very large and mixes many concerns in one screen: `src/app/account/page.tsx`.
  - Admin products page is also very large and likely hard to maintain: `src/app/admin/products/page.tsx`.
- Likely issues to address:
  - Break account page into tabs/route segments.
  - Improve empty states, loading states, and section hierarchy.
  - Review spacing, CTA consistency, and mobile responsiveness on dense screens.

### 9. Global button behavior is risky
- Status: Confirmed from code
- User impact: Any future form can inherit accidental submit behavior.
- Evidence:
  - `src/components/ui/button.tsx` does not set a default `type`.
- Fix direction:
  - Make shared button default to `type="button"` unless explicitly overridden.

## Suggested Additions

These are not bugs, but solid additions that can improve the project:

- Real payment gateway integration for EasyPaisa/JazzCash instead of flow-only checkout.
- Guest checkout or forced-login checkout with a cleaner pre-checkout auth flow.
- Route-level loading UI using Next `loading.tsx`.
- Search, sorting, and filter persistence across product listing pages.
- Better order confirmation screen instead of direct redirect to `/account`.
- Order success toast/email/SMS status feedback after placement.
- Skeletons and optimistic UI for wishlist, account, and admin sections.
- Centralized API contracts/shared validation types between frontend and backend.
- Performance audit for large images and repeated client fetches.
- Error monitoring and request logging for checkout/auth failures.

## Recommended Fix Order

1. Fix checkout auth flow so `Place order` no longer returns `Unauthorized`.
2. Fix shared button default type and checkout `Back` button behavior.
3. Replace `window.location.href` navigations with Next router APIs.
4. Improve slow loading by reducing client fetch waterfalls and reviewing backend hosting.
5. Refactor large pages into smaller modules and improve UI consistency.

## Notes

- Existing unrelated changes were already present in the worktree:
  - `backend/src/lib/mailer.ts`
  - `backend/dist/`
- They were not modified as part of this issue scan.
