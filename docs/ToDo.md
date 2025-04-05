

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


Add a disclosures page? Do i need a privacy policy page, terms page, disclosures page, cookies page??
    Replace the placeholder with a functional link (e.g., "See our Disclosures page at www.cashtags.ai/disclosures")
    Cookie Policy: Replace "[Cookie Policy]" with a link (e.g., www.cashtags.ai/cookies) and ensure it details cookie types, purposes, and opt-out options. GDPR requires affirmative consent for non-essential cookies.

and offering a contact (support@cashtags.ai) for breaches.

Add explicit consent mechanisms (e.g., for marketing or non-essential cookies).


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



Issues and Points of Failure




Unauthenticated Access to Resource-Intensive Routes
Issue: Routes like /api/[ticker]/series and /api/additionalData don’t require authentication, allowing anyone to repeatedly hit them. Even with withAuthAndRateLimit in some routes, unauthenticated access elsewhere remains a gap.
Point of Failure: External bots or users could exhaust your Alpaca API quota or inflate Vercel invocations.

Expensive External API Calls Without Caching
Issue: Calls to Alpaca (/api/[ticker]/series, /api/[ticker]/ticker) and OpenAI (/api/summary) are made on-demand without caching. Repeated requests for the same ticker/topic increase costs.
Point of Failure: No caching means every request triggers a fresh API call, amplifying costs during high traffic or attacks.

No DDoS Protection at the Network Level
Issue: Vercel’s default setup doesn’t include robust DDoS protection beyond basic scaling. Your app relies on application-level logic, leaving it exposed to layer 7 attacks (e.g., HTTP floods).
Point of Failure: Vercel’s serverless pricing scales with invocations, so a flood of requests directly increases your bill.

Real-Time Subscriptions Without Throttling
Issue: useTickerData in lib/hooks.ts subscribes to Supabase real-time updates for premium users without throttling or limiting update frequency, potentially overloading the client and server.
Point of Failure: Rapid database changes could trigger excessive updates, increasing Vercel execution time and Supabase bandwidth costs.

No Input Validation on API Parameters
Issue: Routes like /api/[ticker]/posts and /api/[ticker]/series accept dynamic [ticker] parameters without strict validation, allowing malformed or abusive inputs (e.g., excessively long strings).
Point of Failure: Invalid inputs could cause errors or unnecessary resource consumption, inflating costs.

Webhook Endpoint Exposure
Issue: /api/webhook for Stripe is publicly accessible and only verifies signatures, but lacks additional protections like IP whitelisting or rate limiting.
Point of Failure: Fake webhook requests could trigger unnecessary database updates, increasing Supabase and Vercel costs.