// app/billing/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/hooks";
import { AuthButtons } from "@/components/AuthButtons";
import { supabase } from "@/lib/supabase";
import { getEnvironment } from "@/lib/utils";

export default function Billing() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCustomerPortal = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) throw new Error("No active session.");

      const accessToken = session.access_token;
      const environment = getEnvironment();
      const tableName = environment === "dev" ? "user_subscriptions_preview" : "user_subscriptions_prod";

      const { data: subData, error: subError } = await supabase
        .from(tableName)
        .select("stripe_customer_id")
        .eq("user_id", user.id)
        .single();

      if (subError || !subData?.stripe_customer_id) throw new Error("No Stripe customer ID found.");

      const response = await fetch("/api/stripe-customer-portal", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ customerId: subData.stripe_customer_id }),
      });

      const { url } = await response.json();
      if (!response.ok) throw new Error("Failed to generate portal link.");
      window.location.href = url;
    } catch (err) {
      console.error("Error accessing customer portal:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="p-6 max-w-4xl mx-auto bg-gray-900 text-gray-200 min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Please Log In</h1>
        <AuthButtons />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto bg-gray-900 text-gray-200 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Billing</h1>
      <p className="mb-4">Manage your subscription and billing details through the Stripe Customer Portal.</p>
      <button
        onClick={handleCustomerPortal}
        disabled={loading}
        className={`px-4 py-2 bg-blue-600 text-white rounded ${
          loading ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-700"
        }`}
      >
        {loading ? "Loading..." : "Go to Stripe Customer Portal"}
      </button>
      {error && <p className="text-red-500 mt-4">{error}</p>}
    </div>
  );
}