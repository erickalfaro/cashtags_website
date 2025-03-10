// app/api/stripe-customer-portal/route.ts
import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  console.log("POST request to /api/stripe-customer-portal received");

  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.error("Missing or invalid Authorization header");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accessToken = authHeader.split(" ")[1];
  const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
  if (authError || !user) {
    console.error("Supabase auth error:", authError?.message);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { customerId } = await req.json();
  if (!customerId) {
    console.error("Missing customerId in request body");
    return NextResponse.json({ error: "Missing customer ID" }, { status: 400 });
  }

  console.log("Processing Stripe portal session for customerId:", customerId);

  const stripe = getStripe();
  try {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL || `https://${process.env.VERCEL_URL}`}/billing`,
    });
    console.log("Stripe portal session created:", portalSession.url);
    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error("Stripe error:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Failed to create portal session" }, { status: 500 });
  }
}