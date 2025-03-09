// app/api/webhook/route.ts
import { NextResponse } from "next/server";
import { getStripe } from "../../../lib/stripe";
import { Stripe } from "stripe";
import { supabase } from "../../../lib/supabase";
import { getEnvironment } from "../../../lib/utils";

interface SubscriptionUpdate {
  subscription_status: "FREE" | "PREMIUM";
  stripe_subscription_id: string | null;
  ticker_click_count: number;
  current_period_end: string | null;
  cancel_at: string | null;
  updated_at: string;
}

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const body = await req.text();

  if (!sig) return NextResponse.json({ error: "No signature" }, { status: 400 });

  const environment = getEnvironment();
  const tableName = environment === "dev" ? "user_subscriptions_preview" : "user_subscriptions_prod";
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) return NextResponse.json({ error: "Webhook secret missing" }, { status: 500 });

  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Webhook signature verification failed" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const customerId = session.customer as string;
      const subscriptionId = session.subscription as string;

      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const { data: user, error } = await supabase
        .from(tableName)
        .select("user_id, ticker_click_count")
        .eq("stripe_customer_id", customerId)
        .single();

      if (error || !user) return NextResponse.json({ error: "User not found" }, { status: 404 });

      const { error: updateError } = await supabase
        .from(tableName)
        .upsert(
          {
            user_id: user.user_id,
            subscription_status: "PREMIUM",
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            ticker_click_count: user.ticker_click_count || 0,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );

      if (updateError) return NextResponse.json({ error: "Failed to update subscription" }, { status: 500 });
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      const status = subscription.status === "active" ? "PREMIUM" : "FREE";
      const cancelAt = subscription.cancel_at ? new Date(subscription.cancel_at * 1000) : null;

      const { data: user, error } = await supabase
        .from(tableName)
        .select("user_id, ticker_click_count")
        .eq("stripe_customer_id", customerId)
        .single();

      if (error || !user) return NextResponse.json({ error: "User not found" }, { status: 404 });

      const updates: SubscriptionUpdate = {
        subscription_status: status,
        stripe_subscription_id: subscription.id,
        ticker_click_count: user.ticker_click_count,
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at: cancelAt ? cancelAt.toISOString() : null,
        updated_at: new Date().toISOString(),
      };

      // If cancelled and period has ended, revert to FREE
      if (subscription.cancel_at_period_end && subscription.current_period_end * 1000 <= Date.now()) {
        updates.subscription_status = "FREE";
        updates.stripe_subscription_id = null;
        updates.current_period_end = null;
        updates.cancel_at = null;
      }

      const { error: updateError } = await supabase
        .from(tableName)
        .update(updates)
        .eq("user_id", user.user_id);

      if (updateError) return NextResponse.json({ error: "Failed to update subscription" }, { status: 500 });
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const { data: user, error } = await supabase
        .from(tableName)
        .select("ticker_click_count")
        .eq("stripe_subscription_id", subscription.id)
        .single();

      if (error || !user) return NextResponse.json({ error: "User not found" }, { status: 404 });

      const { error: updateError } = await supabase
        .from(tableName)
        .update({
          subscription_status: "FREE",
          stripe_subscription_id: null,
          ticker_click_count: user.ticker_click_count,
          current_period_end: null,
          cancel_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_subscription_id", subscription.id);

      if (updateError) return NextResponse.json({ error: "Failed to delete subscription" }, { status: 500 });
      break;
    }

    default:
      console.log("Unhandled event type:", event.type);
  }

  return NextResponse.json({ received: true });
}