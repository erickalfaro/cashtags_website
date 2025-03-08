// app/api/subscribe/route.ts
import { NextResponse } from "next/server";
import { stripe } from "../../../lib/stripe";
import { supabase } from "../../../lib/supabase";

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("Missing or invalid Authorization header");
      return NextResponse.json(
        { error: "Unauthorized: Missing or invalid Authorization header" },
        { status: 401 }
      );
    }

    const accessToken = authHeader.split(" ")[1];
    console.log("Received Access Token:", accessToken); // Log for debugging

    // Set the session using the provided access token
    const { data: session, error: sessionError } = await supabase.auth.getUser(accessToken);
    if (sessionError || !session.user) {
      console.error("Session validation error:", sessionError?.message);
      return NextResponse.json(
        { error: "Unauthorized: Invalid or expired token" },
        { status: 401 }
      );
    }

    if (session.user.id !== userId) {
      return NextResponse.json(
        { error: "Unauthorized: User ID mismatch" },
        { status: 401 }
      );
    }

    // Check if STRIPE_PRICE_ID is defined
    const stripePriceId = process.env.STRIPE_PRICE_ID;
    if (!stripePriceId) {
      console.error("STRIPE_PRICE_ID is not set in environment variables.");
      return NextResponse.json(
        { error: "Server configuration error: Missing Stripe Price ID" },
        { status: 500 }
      );
    }

    // Check if user already has a Stripe customer ID
    const { data: userSub } = await supabase
      .from("user_subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .single();

    let customerId = userSub?.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email,
        metadata: { supabaseUserId: userId },
      });
      customerId = customer.id;

      await supabase
        .from("user_subscriptions")
        .upsert({ user_id: userId, stripe_customer_id: customerId });
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [{ price: stripePriceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/?canceled=true`,
    });

    return NextResponse.json(
      { sessionId: checkoutSession.id },
      { headers: { "Access-Control-Allow-Origin": "*" } }
    );
  } catch (error: unknown) {
    let errorMessage = "Unknown error occurred";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === "string") {
      errorMessage = error;
    }

    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session", details: errorMessage },
      { status: 500 }
    );
  }
}