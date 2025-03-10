// app/api/subscribe/route.ts
import { NextResponse } from "next/server";
import { getStripe } from "../../../lib/stripe";
import { supabase } from "../../../lib/supabase";
import { getEnvironment } from "../../../lib/utils";

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("Unauthorized: No Bearer token");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accessToken = authHeader.split(" ")[1];
    const { data: session, error: sessionError } = await supabase.auth.getUser(accessToken);
    if (sessionError || !session.user) {
      console.error("Unauthorized: Invalid token", sessionError);
      return NextResponse.json({ error: "Unauthorized: Invalid token" }, { status: 401 });
    }

    if (session.user.id !== userId) {
      console.error("Unauthorized: User ID mismatch", { expected: session.user.id, received: userId });
      return NextResponse.json({ error: "Unauthorized: User ID mismatch" }, { status: 401 });
    }

    const environment = getEnvironment();
    const tableName = environment === "dev" ? "user_subscriptions_preview" : "user_subscriptions_prod";
    const stripePriceId = process.env.STRIPE_PRICE_ID;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `https://${process.env.VERCEL_URL}`;

    if (!stripePriceId) {
      console.error("STRIPE_PRICE_ID is missing");
      return NextResponse.json({ error: "Missing Stripe Price ID" }, { status: 500 });
    }

    if (!baseUrl) {
      console.error("NEXT_PUBLIC_BASE_URL or VERCEL_URL is missing");
      return NextResponse.json({ error: "Missing base URL configuration" }, { status: 500 });
    }

    const stripe = getStripe();

    const { data: userSub, error: subError } = await supabase
      .from(tableName)
      .select("stripe_customer_id, subscription_status, stripe_subscription_id")
      .eq("user_id", userId)
      .single();

    if (subError && subError.code !== "PGRST116") {
      console.error("Error fetching subscription:", subError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    let customerId = userSub?.stripe_customer_id;

    // Check for an existing cancellable subscription
    if (userSub?.subscription_status === "PREMIUM" && userSub.stripe_subscription_id) {
      const subscription = await stripe.subscriptions.retrieve(userSub.stripe_subscription_id);
      if (subscription.status === "active" && !subscription.cancel_at_period_end) {
        console.log("User already subscribed with an active, non-cancelling subscription:", userId);
        return NextResponse.json({ error: "You are already subscribed to PREMIUM" }, { status: 400 });
      } else if (subscription.status === "active" && subscription.cancel_at_period_end) {
        // Un-cancel the existing subscription
        const updatedSubscription = await stripe.subscriptions.update(userSub.stripe_subscription_id, {
          cancel_at_period_end: false,
        });
        console.log("Un-cancelled subscription:", userSub.stripe_subscription_id);

        // Update database
        const { error: updateError } = await supabase
          .from(tableName)
          .update({
            cancel_at: null,
            current_period_end: new Date(updatedSubscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", userId);

        if (updateError) {
          console.error("Error updating subscription after un-cancelling:", updateError);
          return NextResponse.json({ error: "Failed to update subscription" }, { status: 500 });
        }

        return NextResponse.json({ message: "Subscription reactivated successfully" });
      }
    }

    // Create a new customer if none exists
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email,
        metadata: { supabaseUserId: userId },
      });
      customerId = customer.id;

      const { error: upsertError } = await supabase.from(tableName).upsert({
        user_id: userId,
        stripe_customer_id: customerId,
        subscription_status: "FREE",
        ticker_click_count: 0,
        updated_at: new Date().toISOString(),
      });

      if (upsertError) {
        console.error("Error upserting subscription:", upsertError);
        return NextResponse.json({ error: "Failed to create subscription record" }, { status: 500 });
      }
      console.log("Created new customer and subscription record:", customerId);
    }

    // Create a new subscription if no cancellable one exists
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [{ price: stripePriceId, quantity: 1 }],
      success_url: `${baseUrl}/?success=true`,
      cancel_url: `${baseUrl}/?canceled=true`,
    });

    return NextResponse.json({ sessionId: checkoutSession.id });
  } catch (error) {
    console.error("Error in subscription process:", error);
    return NextResponse.json({ error: "Failed to process subscription" }, { status: 500 });
  }
}