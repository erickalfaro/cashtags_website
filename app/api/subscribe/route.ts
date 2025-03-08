// app/api/subscribe/route.ts
import { NextResponse } from "next/server";
import { stripe } from "../../../lib/stripe";
import { supabase } from "../../../lib/supabase";
import { getEnvironment } from "../../../lib/utils";

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accessToken = authHeader.split(" ")[1];
    const { data: session, error: sessionError } = await supabase.auth.getUser(accessToken);
    if (sessionError || !session.user) {
      return NextResponse.json({ error: "Unauthorized: Invalid token" }, { status: 401 });
    }

    if (session.user.id !== userId) {
      return NextResponse.json({ error: "Unauthorized: User ID mismatch" }, { status: 401 });
    }

    const environment = getEnvironment();
    const stripePriceId =
      environment === "dev"
        ? process.env.STRIPE_PRICE_ID_DEV
        : process.env.STRIPE_PRICE_ID_PROD;

    if (!stripePriceId) {
      return NextResponse.json({ error: "Missing Stripe Price ID" }, { status: 500 });
    }

    // Check for existing subscription in this environment
    const { data: userSub } = await supabase
      .from("user_subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .eq("environment", environment)
      .single();

    let customerId = userSub?.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email,
        metadata: { supabaseUserId: userId, environment },
      });
      customerId = customer.id;

      await supabase.from("user_subscriptions").upsert({
        user_id: userId,
        stripe_customer_id: customerId,
        environment,
      });
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [{ price: stripePriceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/?canceled=true`,
    });

    return NextResponse.json({ sessionId: checkoutSession.id });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}