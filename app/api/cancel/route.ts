// app/api/cancel/route.ts
import { supabase } from "../../../lib/supabase";
import { getStripe } from "../../../lib/stripe";
import { NextResponse } from "next/server";
import { getEnvironment } from "../../../lib/utils";

export async function POST(req: Request) {
  const user = await supabase.auth.getUser();
  if (!user.data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const environment = getEnvironment();
  const tableName = environment === "dev" ? "user_subscriptions_preview" : "user_subscriptions_prod";
  const { data: subData, error } = await supabase
    .from(tableName)
    .select("stripe_subscription_id, subscription_status")
    .eq("user_id", user.data.user.id)
    .single();

  if (error || !subData) return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
  if (subData.subscription_status !== "PREMIUM" || !subData.stripe_subscription_id) {
    return NextResponse.json({ error: "No active subscription to cancel" }, { status: 400 });
  }

  const stripe = getStripe();
  const subscription = await stripe.subscriptions.update(subData.stripe_subscription_id, {
    cancel_at_period_end: true,
  });

  return NextResponse.json({
    success: true,
    message: `Subscription will end on ${new Date(subscription.current_period_end * 1000).toLocaleDateString()}`,
  });
}