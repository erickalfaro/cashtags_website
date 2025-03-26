

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

