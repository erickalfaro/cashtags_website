// components/SubscriptionButton.tsx
"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { supabase } from "../lib/supabase";
import { User } from "@supabase/supabase-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string);

export const SubscriptionButton: React.FC<{
  user: User;
  disabled?: boolean;
  onSuccess?: () => void;
}> = ({ user, disabled = false, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: session, error: sessionError } = await supabase.auth.refreshSession();
      if (sessionError || !session?.session) throw new Error("Failed to refresh session");
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

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to initiate subscription");

      if (data.sessionId) {
        // New subscription case: redirect to Checkout
        const stripe = await stripePromise;
        if (!stripe) throw new Error("Stripe failed to initialize");

        const { error: redirectError } = await stripe.redirectToCheckout({ sessionId: data.sessionId });
        if (redirectError) throw new Error(redirectError.message);
      } else if (data.message) {
        // Un-cancel case: no redirect needed, just refresh subscription
        console.log("Subscription reactivated:", data.message);
        if (onSuccess) onSuccess();
      } else {
        throw new Error("Unexpected response from server");
      }
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
        disabled={loading || disabled}
        className={`px-4 py-2 bg-green-600 text-white rounded ${
          loading || disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-green-700"
        }`}
      >
        {loading ? "Loading..." : "Subscribe to PREMIUM ($10/month)"}
      </button>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
};