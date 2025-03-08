// app/api/webhook/route.ts
import { NextResponse } from "next/server";
import { stripe } from "../../../lib/stripe";
import Stripe from "stripe"; // Add this import
import { supabase } from "../../../lib/supabase";

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const body = await req.text();

  console.log("Webhook received:", { sig, body }); // Log incoming request

  if (!sig) {
    console.error("No signature provided");
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET as string);
    console.log("Webhook event constructed:", event.type);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Webhook Error" }, { status: 400 });
  }

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      const status = subscription.status === "active" ? "PREMIUM" : "FREE";

      console.log("Processing subscription event:", { customerId, status });

      const { data: user, error: userError } = await supabase
        .from("user_subscriptions")
        .select("user_id")
        .eq("stripe_customer_id", customerId)
        .single();

      if (userError) {
        console.error("Supabase user fetch error:", userError);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
      }

      if (user) {
        const { error: updateError } = await supabase
          .from("user_subscriptions")
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
        console.log("Subscription updated successfully for user:", user.user_id);
      } else {
        console.warn("No user found for customerId:", customerId);
      }
      break;
    case "customer.subscription.deleted":
      const deletedSub = event.data.object as Stripe.Subscription;
      const { error: deleteError } = await supabase
        .from("user_subscriptions")
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