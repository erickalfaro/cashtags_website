// app/my-account/page.tsx
"use client";

import { useState } from "react";
import { useAuth, useSubscription } from "../../lib/hooks";
import { SubscriptionButton } from "../../components/SubscriptionButton";
import { supabase } from "../../lib/supabase";

export default function MyAccount() {
  const { user, signOut } = useAuth();
  const { subscription, fetchSubscription } = useSubscription(user);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) {
    return <div>Please log in to view your account.</div>;
  }

  const isFree = subscription.status !== "PREMIUM";
  const hasCancelAt = subscription.cancelAt !== null && subscription.cancelAt !== undefined;
  const isPremiumActive = subscription.status === "PREMIUM" && !hasCancelAt;
  const isPremiumCancelling =
    subscription.status === "PREMIUM" && hasCancelAt && subscription.cancelAt! > new Date();
  const isPostCancellation =
    subscription.status === "PREMIUM" && hasCancelAt && subscription.cancelAt! <= new Date();

  const effectiveClicksLeft = isPostCancellation ? subscription.clicksLeft : subscription.clicksLeft;

  const handleCancelSubscription = async () => {
    setCancelLoading(true);
    setError(null);
    try {
      const session = await supabase.auth.getSession();
      const accessToken = session.data.session?.access_token;
      if (!accessToken) throw new Error("No access token available");

      const response = await fetch("/api/cancel", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to cancel subscription");
      }

      await fetchSubscription();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setCancelLoading(false);
    }
  };

  const handleCustomerPortal = async () => {
    setPortalLoading(true);
    setError(null);
    try {
      const session = await supabase.auth.getSession();
      const accessToken = session.data.session?.access_token;
      if (!accessToken) throw new Error("No access token available");

      const response = await fetch("/api/create-customer-portal", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create customer portal session");
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setPortalLoading(false);
    }
  };

  return (
    <div className="text-gray-200">
      <h1 className="text-2xl font-bold mb-6">My Account</h1>
      <div className="space-y-4">
        <p>Email: {user.email}</p>
        <p>
          Subscription Status:{" "}
          {isFree || isPostCancellation
            ? `FREE (${effectiveClicksLeft} clicks left)`
            : isPremiumActive
            ? `PREMIUM - Active${subscription.currentPeriodEnd ? ` - Renews on ${subscription.currentPeriodEnd.toLocaleDateString()}` : ""}`
            : isPremiumCancelling
            ? `PREMIUM - Cancelling on ${subscription.cancelAt!.toLocaleDateString()}`
            : ""}
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          {(isFree || isPostCancellation) && (
            <SubscriptionButton user={user} disabled={false} onSuccess={fetchSubscription} />
          )}
          {isPremiumCancelling && (
            <SubscriptionButton
              user={user}
              disabled={false}
              onSuccess={fetchSubscription}
              label="Reactivate Subscription"
            />
          )}
          {isPremiumActive && (
            <button
              onClick={handleCancelSubscription}
              disabled={cancelLoading}
              className={`px-4 py-2 bg-red-600 text-white rounded ${
                cancelLoading ? "opacity-50 cursor-not-allowed" : "hover:bg-red-700"
              }`}
            >
              {cancelLoading ? "Cancelling..." : "Cancel Subscription"}
            </button>
          )}
          {(isPremiumActive || isPremiumCancelling) && (
            <button
              onClick={handleCustomerPortal}
              disabled={portalLoading}
              className={`px-4 py-2 bg-blue-600 text-white rounded ${
                portalLoading ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-700"
              }`}
            >
              {portalLoading ? "Loading..." : "Manage Billing"}
            </button>
          )}
        </div>

        {error && <p className="text-red-500">{error}</p>}

        <button
          onClick={signOut}
          className="mt-6 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}