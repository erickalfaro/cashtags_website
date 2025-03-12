https://gitingest.com/
https://vercel.com/cashtags/cashtags-website/deployments
https://cashtags-dev.vercel.app/
https://cashtags.ai

https://dashboard.stripe.com/test/customers/
https://dashboard.stripe.com/test/webhooks/
https://console.cloud.google.com/apis/api/identitytoolkit.googleapis.com/credentials

Setting up cloudflare > supabase
https://grok.com/chat/146b3476-605d-403d-b40e-b49006c72145

# Todo: 

Website: 
- Formatting: 
    - Create a page for 
        - Home page which is the defaul page (which is the page that contains Ticker Tape, Market Canvas, etc)
        - My Account (Which should also have a Logout Button, Subscribe Button and Unsubscribe Button)
        - Disclaimer/Legal/Privacy policy
        - Billing/Stripe Customer Portal
    - Add hamburger bar which allows Navigation to each page listed above.


- Allow for logging in with email in general
- when user is subscribed hide the Subscribe to Premium
- Only way to unsubscribe is to click on hamburger>account>unsubscribe
- Do we need a refresh button? or does this auto refresh? 
- website does a full refresh when looking away 
- Days left in membership
- add ddos protection

Supabase: 
- RLS? 
- Public vs Private schema
- Do i need dev vs prod tables? sign-ins etc
- Table headers should be sticky
- Allow users to search for tickers
- Landing page should be cleaner 
- Market Canvas needs better formatting
- PostViewer should only be accessible via subscription
- home page needs lots of formatting changes
    - mobile needs to be fixed
- Rename components to industry standard 

Stripe:
- Add ability to cancel
- How does membership expiration work? 


# Bugs

#### 
the website makes you sign in every time instead of remembering that you already signed in 

### 
if you exist in user_subscriptions DEV as premium, are you premium on PROD by default? 

# Prompts: 
- Given the code below, what am i not doing right
    - in terms of dev>preview, main>prod
    - refreshing data 
    - authentication

# Immediate next steps:
- Fix VERCEL_ENV




# Project Description: 

## 1. Overview

- **Purpose**: A web application built with Next.js that delivers financial data (e.g., ticker tape, stock ledger, market canvas) and offers a subscription-based PREMIUM tier for enhanced access.
- **Tech Stack**:
  - **Frontend**: Next.js (React, TypeScript), hosted on Vercel.
  - **Backend**: Next.js API routes.
  - **Database**: Supabase (PostgreSQL).
  - **Payment Processing**: Stripe.
- **Deployment**: Vercel, with separate environments:
  - **Dev**: Uses `user_subscriptions_preview` Supabase table.
  - **Prod**: Uses `user_subscriptions_prod` Supabase table.

---

## 2. Main Functionalities and Features

### 2.1 User Tiers
- **FREE Tier**:
  - Limited access (10 clicks/month).
  - "Subscribe to PREMIUM" button clickable, "Unsubscribe" greyed out.
- **PREMIUM Tier (Active)**:
  - Unlimited access.
  - "Subscribe" greyed out, "Unsubscribe" clickable.
- **PREMIUM Tier (Cancelling)**:
  - Access until `current_period_end`.
  - "Subscribe" clickable (to un-cancel), "Unsubscribe" greyed out.
- **Post-Cancellation**:
  - Reverts to FREE tier after `current_period_end`.
  - "Subscribe" clickable, "Unsubscribe" greyed out.

### 2.2 Authentication
- Supabase Auth with Google/Twitter OAuth via `AuthButtons.tsx`.
- Session-based access control for API routes and UI.

### 2.3 Subscription Management
- **Pricing**: $10/month recurring subscription via Stripe Checkout.
- **Features**:
  - Cancel: Sets `cancel_at_period_end: true`.
  - Un-cancel: Reverts to active without double-charging.
  - Real-time updates via Supabase and Stripe webhooks.

### 2.4 Financial Data Display
- **Ticker Tape**: Sortable list of stock data (e.g., cashtag, latest_price, chng).
- **Stock Ledger**: Detailed stock information.
- **Market Canvas**: Visual representation of market data.
- **Post Viewer & GenAI Summary**: Social media posts and AI-generated summaries for selected stocks.

### 2.5 Click Tracking
- FREE tier: Limited to 10 clicks, tracked via `ticker_click_count` in Supabase.
- PREMIUM tier: Unlimited clicks.

---

## 3. Backend (Next.js API Routes)

- **Purpose**: Manages subscription logic, webhook processing, and authentication.
- **Key Endpoints**:
  - **`/api/subscribe`**:
    - Creates Stripe Checkout session for FREE users or those without active subscriptions.
    - Un-cancels existing subscriptions (`cancel_at_period_end: false`).
    - Returns `sessionId` (new subscriptions) or success message (un-cancelling).
  - **`/api/cancel`**:
    - Updates active PREMIUM subscription to cancel at period end (`cancel_at_period_end: true`).
    - Updates `cancel_at` in Supabase.
  - **`/api/webhook`**:
    - Processes Stripe events (e.g., `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`).
    - Syncs subscription state (`status`, `current_period_end`, `cancel_at`) with Supabase.
- **Logic**:
  - Uses `getStripe()` for Stripe API interactions.
  - Authenticates requests with Supabase access tokens via `supabase.auth.getUser()`.
  - Selects environment (dev/prod) with `getEnvironment()` for appropriate Supabase table.

---

## 4. Supabase (Database)

- **Purpose**: Stores user subscription data and enforces access control.
- **Tables**:
  - `user_subscriptions_preview` (dev) / `user_subscriptions_prod` (prod):
    - **Columns**:
      - `user_id` (UUID, FK to `auth.users`): Links to Supabase Auth.
      - `subscription_status` ("FREE" | "PREMIUM"): Tracks tier.
      - `stripe_customer_id` (text): Stripe customer ID.
      - `stripe_subscription_id` (text, unique): Stripe subscription ID.
      - `ticker_click_count` (integer): Tracks FREE tier clicks.
      - `updated_at` (timestamp): Last update time.
      - `current_period_end` (timestamp): End of current billing period.
      - `cancel_at` (timestamp): Cancellation date (null if active).
    - **Row-Level Security (RLS)**:
      - Authenticated users: Access/update own row only (`auth.uid() = user_id`).
      - Service role: Full access (used by backend).
- **Operations**:
  - **Upsert**: Creates/updates subscription records (e.g., post-Checkout).
  - **Update**: Modifies `cancel_at`, `current_period_end`, etc., based on Stripe events.
  - **Real-Time**: Subscribes to changes via `postgres_changes` for frontend sync.

---

## 5. Stripe (Payment Processing)

- **Purpose**: Manages subscription payments and billing cycles.
- **Key Components**:
  - **Customers**: Created via `stripe.customers.create` (linked to `stripe_customer_id`).
  - **Subscriptions**:
    - Created via Checkout sessions (`stripe.checkout.sessions.create`).
    - Updated via `stripe.subscriptions.update` (e.g., cancellation/un-cancellation).
    - States: `active`, `canceled`, with `cancel_at_period_end` flag.
  - **Price**: $10/month recurring plan (ID in `STRIPE_PRICE_ID`).
  - **Webhooks**: Sends events to `/api/webhook` for Supabase updates.
- **Behavior**:
  - Charges $10 immediately upon subscription creation.
  - Bills monthly unless cancelled.
  - Supports un-cancelling (`cancel_at_period_end: false`) without extra charges in the same period.

---

## 6. Frontend (Next.js)

- **Purpose**: Displays financial data and manages subscription UI with real-time updates.
- **Key Files**:
  - **`app/page.tsx`**:
    - Renders main UI with conditional button states and status display.
    - Uses `useSubscription` hook for subscription state.
    - Handles cancel (`handleCancelSubscription`) and subscribe (via `SubscriptionButton`).
  - **`components/SubscriptionButton.tsx`**:
    - Initiates subscription/un-cancellation via `/api/subscribe`.
    - Redirects to Checkout (new subscriptions) or refreshes state (un-cancelling).
  - **`lib/hooks.ts`**:
    - `useSubscription`: Fetches/updates subscription state from Supabase, handles post-cancellation reversion to FREE.
- **UI Logic**:
  - Buttons toggle based on `isFree`, `isPremiumActive`, `isPremiumCancelling`, `isPostCancellation`.
  - Status reflects current tier and billing dates.

---

## 7. CI/CD Pipeline

- **Version Control**: GitHub with two branches:
  - `dev`: Development branch.
  - `main`: Production branch.
- **Deployment**:
  - **Dev Branch**:
    - Auto-deploys to Vercel preview (e.g., `cashtags-dev.vercel.app`) on push.
    - Uses `user_subscriptions_preview` Supabase table.
    - Deployment protection bypassed with Vercel’s Bypass Automation secret.
  - **Main Branch**:
    - Deploys to production (e.g., `cashtags.ai`) on merged PR from `dev` to `main`.
    - Uses `user_subscriptions_prod` Supabase table.
- **Local Testing**:
  - Runs on `localhost:3000` via `npm run dev`.
  - No webhook support unless using Stripe CLI or ngrok.
- **Build Process**:
  - Vercel runs `npm run build` (Next.js build with TypeScript/ESLint checks).
  - Caches dependencies for faster deployments.

---

## 8. How It All Ties Together

- **User Subscribes**:
  - Frontend → `/api/subscribe` → Stripe Checkout → Webhook → Supabase → Frontend refreshed.
- **User Cancels**:
  - Frontend → `/api/cancel` → Stripe update → Supabase → Frontend refreshed.
- **User Resubscribes (Un-Cancels)**:
  - Frontend → `/api/subscribe` → Stripe update (un-cancel) → Supabase → Frontend refreshed.
- **Period Ends**:
  - Stripe → Webhook → Supabase (reverts to FREE) → Frontend refreshed.

---

## 9. Main Features Recap

- **Subscription Tiers**: FREE (limited) and PREMIUM (unlimited).
- **Dynamic UI**: Buttons and status adapt to subscription state.
- **Payment Integration**: Seamless Stripe billing with un-cancel support.
- **Real-Time Updates**: Supabase and Stripe keep data in sync.
- **Financial Insights**: Ticker tape, stock ledger, market canvas, and AI summaries.


