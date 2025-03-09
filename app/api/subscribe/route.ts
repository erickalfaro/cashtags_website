// app/api/subscribe/route.ts
import { NextResponse } from "next/server";
import { getStripe } from "../../../lib/stripe"; // Updated import
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
    const tableName = environment === "dev" ? "user_subscriptions_preview" : "user_subscriptions_prod";
    const stripePriceId = process.env.STRIPE_PRICE_ID;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `https://${process.env.VERCEL_URL}`;

    console.log("Subscribe endpoint:", { environment, tableName, stripePriceId, baseUrl });

    if (!stripePriceId) {
      console.error("STRIPE_PRICE_ID is missing");
      return NextResponse.json({ error: "Missing Stripe Price ID" }, { status: 500 });
    }

    if (!baseUrl) {
      console.error("NEXT_PUBLIC_BASE_URL or VERCEL_URL is missing");
      return NextResponse.json({ error: "Missing base URL configuration" }, { status: 500 });
    }

    const stripe = getStripe(); // Use the function here

    const { data: userSub, error: subError } = await supabase
      .from(tableName)
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .single();

    if (subError && subError.code !== "PGRST116") {
      console.error("Error fetching subscription:", subError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    let customerId = userSub?.stripe_customer_id;
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
        updated_at: new Date().toISOString(),
      });

      if (upsertError) {
        console.error("Error upserting subscription:", upsertError);
        return NextResponse.json({ error: "Failed to create subscription record" }, { status: 500 });
      }
      console.log("Created new customer and subscription record:", customerId);
    }

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
    console.error("Error creating checkout session:", error);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}