
```bash
npm run dev
```

# Todo: 

Website: 
- Days left in membership
- Sign up recurring vs sign up one time
- Add a legal page for disclaimers
- website does a full refresh when looking away 

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

