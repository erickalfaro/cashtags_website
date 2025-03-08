import { NextResponse } from "next/server";
import { stripe } from "../../../lib/stripe";
import { Stripe } from "stripe"; // Import Stripe for types
import { supabase } from "../../../lib/supabase";
import { getEnvironment } from "../../../lib/utils";

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const body = await req.text();

  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  const environment = getEnvironment();
  const webhookSecret =
    environment === "dev"
      ? process.env.STRIPE_WEBHOOK_SECRET_DEV
      : process.env.STRIPE_WEBHOOK_SECRET_PROD;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret as string);
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

      const { data: user } = await supabase
        .from("user_subscriptions")
        .select("user_id")
        .eq("stripe_customer_id", customerId)
        .eq("environment", environment)
        .single();

      if (user) {
        await supabase
          .from("user_subscriptions")
          .update({
            subscription_status: status,
            stripe_subscription_id: subscription.id,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.user_id)
          .eq("environment", environment);
      }
      break;
    case "customer.subscription.deleted":
      const deletedSub = event.data.object as Stripe.Subscription;
      await supabase
        .from("user_subscriptions")
        .update({ subscription_status: "FREE", stripe_subscription_id: null })
        .eq("stripe_subscription_id", deletedSub.id)
        .eq("environment", environment);
      break;
    default:
      console.log("Unhandled event type:", event.type);
  }

  return NextResponse.json({ received: true });
}