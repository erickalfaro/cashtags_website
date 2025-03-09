// app/api/webhook/route.ts
import { NextResponse } from "next/server";
import { stripe } from "../../../lib/stripe";
import { Stripe } from "stripe";
import { supabase } from "../../../lib/supabase";
import { getEnvironment } from "../../../lib/utils";

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const body = await req.text();

  console.log("Webhook received - Signature:", sig);

  if (!sig) {
    console.error("No Stripe signature provided");
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  const environment = getEnvironment();
  const tableName = environment === "dev" ? "user_subscriptions_preview" : "user_subscriptions_prod";
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  console.log("Webhook - Environment:", environment, "Table:", tableName, "Secret Defined:", !!webhookSecret);

  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET not configured");
    return NextResponse.json({ error: "Webhook secret missing" }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    console.log("Webhook event constructed - Type:", event.type, "ID:", event.id);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Webhook signature verification failed" }, { status: 400 });
  }

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      const status = subscription.status === "active" ? "PREMIUM" : "FREE";

      console.log("Processing subscription - Customer:", customerId, "Status:", status);

      const { data: user, error: userError } = await supabase
        .from(tableName)
        .select("user_id")
        .eq("stripe_customer_id", customerId)
        .single();

      if (userError) {
        console.error("Supabase fetch error:", userError);
        return NextResponse.json({ error: "Database error fetching user" }, { status: 500 });
      }

      if (!user) {
        console.warn("No user found for customerId:", customerId);
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const { error: updateError } = await supabase
        .from(tableName)
        .update({
          subscription_status: status,
          stripe_subscription_id: subscription.id,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.user_id);

      if (updateError) {
        console.error("Supabase update error:", updateError);
        return NextResponse.json({ error: "Failed to update subscription" }, { status: 500 });
      }
      console.log("Subscription updated - User:", user.user_id, "Status:", status);
      break;

    case "customer.subscription.deleted":
      const deletedSub = event.data.object as Stripe.Subscription;
      console.log("Deleting subscription - ID:", deletedSub.id);

      const { error: deleteError } = await supabase
        .from(tableName)
        .update({ subscription_status: "FREE", stripe_subscription_id: null })
        .eq("stripe_subscription_id", deletedSub.id);

      if (deleteError) {
        console.error("Supabase delete error:", deleteError);
        return NextResponse.json({ error: "Failed to delete subscription" }, { status: 500 });
      }
      console.log("Subscription deleted successfully");
      break;

    default:
      console.log("Unhandled event type:", event.type);
  }

  return NextResponse.json({ received: true });
}