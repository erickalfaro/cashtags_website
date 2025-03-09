// lib/stripe.ts
import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY as string;

if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY is not defined in environment variables.");
}

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2025-02-24.acacia",
});