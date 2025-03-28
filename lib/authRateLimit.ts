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
  const points = subscriptionStatus === "PREMIUM" ? 50 : 10;

  try {
    const limiter = new RateLimiterMemory({ points, duration: 60 });
    await limiter.consume(key, 1);
    const { ticker } = await ctx.params;
    return await handler(req, ticker);
  } catch (rateLimitError) {
    console.error("Rate limit exceeded for user:", key, rateLimitError);
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
    return "FREE";
  }

  return data?.subscription_status || "FREE";
}