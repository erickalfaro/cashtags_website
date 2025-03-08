// lib/stripe.ts
import Stripe from "stripe";
import { getEnvironment } from "./utils";

const stripeSecretKey =
  getEnvironment() === "dev"
    ? (process.env.STRIPE_SECRET_KEY_DEV as string)
    : (process.env.STRIPE_SECRET_KEY_PROD as string);

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2025-02-24.acacia",
});