// app/api/cancel/route.ts
import { supabase } from "../../../lib/supabase";
import { getStripe } from "../../../lib/stripe";
import { NextResponse } from "next/server";
import { getEnvironment } from "../../../lib/utils";

export async function POST(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized: No Bearer token" }, { status: 401 });
  }

  const accessToken = authHeader.split(" ")[1];
  const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized: Invalid token" }, { status: 401 });
  }

  const environment = getEnvironment();
  const tableName = environment === "dev" ? "user_subscriptions_preview" : "user_subscriptions_prod";
  const { data: subData, error } = await supabase
    .from(tableName)
    .select("stripe_subscription_id, subscription_status, current_period_end, cancel_at")
    .eq("user_id", user.id)
    .single();

  if (error || !subData) return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
  if (subData.subscription_status !== "PREMIUM" || !subData.stripe_subscription_id) {
    return NextResponse.json({ error: "No active subscription to cancel" }, { status: 400 });
  }

  const stripe = getStripe();
  try {
    const subscription = await stripe.subscriptions.update(subData.stripe_subscription_id, {
      cancel_at_period_end: true,
    });

    const cancelAtDate = new Date(subscription.current_period_end * 1000).toISOString();
    const { error: updateError } = await supabase
      .from(tableName)
      .update({
        cancel_at: cancelAtDate,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    if (updateError) throw new Error("Failed to update cancellation date in database");

    return NextResponse.json({
      success: true,
      message: `Subscription will end on ${new Date(subscription.current_period_end * 1000).toLocaleDateString()}`,
    });
  } catch (err) {
    console.error("Error canceling subscription:", err);
    return NextResponse.json({ error: "Failed to cancel subscription" }, { status: 500 });
  }
}