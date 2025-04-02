// lib/authRateLimit.ts
import { NextResponse } from "next/server";
import { supabase } from "./supabase";
import { RateLimiterMemory } from "rate-limiter-flexible";

type ContextParams = {
  params: Promise<{ ticker?: string }>; // Make ticker optional for endpoints without it
};

// Define subscription tiers and their limits
const RATE_LIMITS = {
  FREE: { points: 10, duration: 60 }, // 10 requests per minute
  PREMIUM: { points: 50, duration: 60 }, // 50 requests per minute
};

export async function withAuthAndRateLimit(
  req: Request,
  ctx: ContextParams,
  handler: (req: Request, ticker?: string) => Promise<NextResponse>
) {
  // Authentication Check
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

  // Rate Limiting
  const key = user.id; // Rate limit based on user ID
  const subscriptionStatus = await getUserSubscriptionStatus(user.id);
  const { points, duration } = RATE_LIMITS[subscriptionStatus];

  try {
    const limiter = new RateLimiterMemory({ points, duration });
    await limiter.consume(key, 1); // Consume 1 point per request

    // Resolve params and pass ticker if present
    const params = await ctx.params;
    const ticker = params.ticker;
    return await handler(req, ticker);
  } catch (rateLimitError) {
    console.error("Rate limit exceeded for user:", key, rateLimitError);
    return NextResponse.json(
      { error: "Too Many Requests", message: "Rate limit exceeded" },
      { status: 429, headers: { "Retry-After": duration.toString() } }
    );
  }
}

// Helper to fetch subscription status
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

// New middleware for endpoints without ticker (e.g., /api/summary)
export async function withAuthAndRateLimitNoTicker(
  req: Request,
  handler: (req: Request) => Promise<NextResponse>
) {
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

  const key = user.id;
  const subscriptionStatus = await getUserSubscriptionStatus(user.id);
  const { points, duration } = RATE_LIMITS[subscriptionStatus];

  try {
    const limiter = new RateLimiterMemory({ points, duration });
    await limiter.consume(key, 1);
    return await handler(req);
  } catch (rateLimitError) {
    console.error("Rate limit exceeded for user:", key, rateLimitError);
    return NextResponse.json(
      { error: "Too Many Requests", message: "Rate limit exceeded" },
      { status: 429, headers: { "Retry-After": duration.toString() } }
    );
  }
}