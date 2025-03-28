// lib/authRateLimit.ts
import { NextResponse } from "next/server";
import { supabase } from "./supabase";
import { RateLimiterMemory } from "rate-limiter-flexible";

type ContextParams = {
  params: Promise<{ ticker: string }>;
};

export async function withAuthAndRateLimit(
  req: Request,
  ctx: ContextParams,
  handler: (req: Request, ticker: string) => Promise<NextResponse>
) {
  // Check Supabase authentication
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Unauthorized: Missing or invalid Authorization header" },
      { status: 401 }
    );
  }

  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized: Invalid token" }, { status: 401 });
  }

  // Get user's ID as the rate limit key
  const key = user.id;

  // Determine rate limit based on subscription status
  const subscriptionStatus = await getUserSubscriptionStatus(user.id);
  const points = subscriptionStatus === "PREMIUM" ? 50 : 10; // 50 requests/min for premium, 10 for free

  try {
    // Apply rate limiting
    const limiter = new RateLimiterMemory({ points, duration: 60 });
    await limiter.consume(key, 1); // Consume 1 point per request
    
    const { ticker } = await ctx.params; // Resolve ticker from ctx
    return await handler(req, ticker);
  } catch (_rateLimitError) { // Prefix with _ to indicate unused
    return NextResponse.json(
      { error: "Too Many Requests", message: "Rate limit exceeded" },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }
}

async function getUserSubscriptionStatus(userId: string): Promise<"FREE" | "PREMIUM"> {
  const environment = process.env.VERCEL_ENV === "production" ? "prod" : "dev";
  const tableName = environment === "dev" ? "user_subscriptions_preview" : "user_subscriptions_prod";

  const { data, error } = await supabase
    .from(tableName)
    .select("subscription_status")
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error("Error fetching subscription status:", error);
    return "FREE"; // Default to FREE if there's an error
  }

  return data?.subscription_status || "FREE";
}