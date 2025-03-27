// app/my-account/page.tsx
"use client";

import { useState } from "react";
import { useAuth, useSubscription } from "@/lib/hooks";
import { SubscriptionButton } from "@/components/SubscriptionButton";
import { supabase } from "@/lib/supabase";

export default function MyAccount() {
  const { user, signOut } = useAuth();
  const { subscription, fetchSubscription } = useSubscription(user);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="bg-black text-green-400 font-mono min-h-screen pt-20 px-4">
        <p className="text-center text-xl">Please log in to view your account.</p>
      </div>
    );
  }

  const handleCancel = async () => {
    setCancelLoading(true);
    setError(null);
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;
      if (!token) throw new Error("Not authorized");

      const res = await fetch("/api/cancel", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error);
      }
      await fetchSubscription();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <div className="bg-black text-green-400 font-mono min-h-screen pt-16 px-4">
      <div className="max-w-md mx-auto border border-green-400 rounded-lg p-8 space-y-6">
        <h1 className="text-3xl font-bold text-center uppercase">My Account</h1>

        <div className="text-center">
          <p className="text-xs uppercase text-gray-500">Signed in as</p>
          <p className="text-lg font-medium">{user.email}</p>
        </div>

        <div className="space-y-2">
          <p>
            Subscription: <span className={`font-semibold ${subscription.status === "PREMIUM" ? "text-green-400" : "text-gray-500"}`}>{subscription.status}</span>
          </p>
          {subscription.status === "PREMIUM" && subscription.currentPeriodEnd && (
            <p className="text-sm text-gray-500">Renews on {subscription.currentPeriodEnd.toLocaleDateString()}</p>
          )}
        </div>

        {subscription.status !== "PREMIUM" ? (
          <SubscriptionButton user={user} onSuccess={fetchSubscription} />
        ) : (
          <div className="space-y-3">
            <button
              onClick={handleCancel}
              disabled={cancelLoading}
              className="w-full py-3 border-2 border-gray-600 text-gray-600 rounded-lg font-semibold transition disabled:opacity-50"
            >
              {cancelLoading ? "Cancelling..." : "Cancel Subscription"}
            </button>
            <SubscriptionButton user={user} onSuccess={fetchSubscription} label="Reactivate Subscription" />
          </div>
        )}

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="flex justify-start">
          <button
            onClick={signOut}
            className="px-4 py-1 border-2 border-red-600 text-red-600 rounded font-semibold text-sm hover:bg-red-800 transition"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}