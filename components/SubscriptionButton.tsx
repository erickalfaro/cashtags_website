// components/SubscriptionButton.tsx
"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { supabase } from "../lib/supabase";
import { User } from "@supabase/supabase-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string);

export const SubscriptionButton: React.FC<{ user: User }> = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async () => {
    setLoading(true);
    setError(null);
    try {
      // Refresh session to ensure a valid token
      const { data: session, error: sessionError } = await supabase.auth.refreshSession();
      if (sessionError || !session.session) throw new Error("Failed to refresh session");
      const accessToken = session.session.access_token;
      if (!accessToken) throw new Error("No access token available");

      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ userId: user.id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to initiate subscription");
      }

      const { sessionId } = await response.json();
      console.log("Checkout Session ID:", sessionId);

      const stripe = await stripePromise;
      if (!stripe) throw new Error("Stripe failed to initialize");

      const { error: redirectError } = await stripe.redirectToCheckout({ sessionId });
      if (redirectError) throw new Error(redirectError.message);
    } catch (error) {
      console.error("Subscription error:", error);
      setError(error instanceof Error ? error.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleSubscribe}
        disabled={loading}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-500"
      >
        {loading ? "Loading..." : "Upgrade to PREMIUM ($10/month)"}
      </button>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
};