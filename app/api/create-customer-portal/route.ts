// app/api/create-customer-portal/route.ts
import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { supabase } from "@/lib/supabase";
import { getEnvironment } from "@/lib/utils";

export async function POST(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accessToken = authHeader.split(" ")[1];
  const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const environment = getEnvironment();
  const tableName = environment === "dev" ? "user_subscriptions_preview" : "user_subscriptions_prod";

  const { data: subData, error: subError } = await supabase
    .from(tableName)
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .single();

  if (subError || !subData?.stripe_customer_id) {
    console.error("Supabase query error:", subError?.message);
    return NextResponse.json({ error: "No Stripe customer ID found" }, { status: 400 });
  }

  const stripe = getStripe();
  try {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subData.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL || `https://${process.env.VERCEL_URL}`}/billing`,
    });
    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error("Stripe error:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Failed to create portal session" }, { status: 500 });
  }
}