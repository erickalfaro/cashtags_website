// app/billing/page.tsx
"use client";

import { useState } from "react";
import { useAuth } from "@/lib/hooks";
import { AuthButtons } from "@/components/AuthButtons";
import { supabase } from "@/lib/supabase";

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

      const response = await fetch("/api/create-customer-portal", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      const responseData = await response.json();
      console.log("API Response:", responseData);

      if (!response.ok) {
        throw new Error(responseData.error || "Failed to generate portal link.");
      }

      window.location.href = responseData.url;
    } catch (err) {
      console.error("Error accessing customer portal:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-gray-200">
        <h1 className="text-2xl font-bold mb-4">Please Log In</h1>
        <AuthButtons />
      </div>
    );
  }

  return (
    <div className="text-gray-200">
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