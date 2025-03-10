// app/my-account/page.tsx
"use client";

import { useAuth, useSubscription } from "@/lib/hooks";
import { AuthButtons } from "@/components/AuthButtons";
import { SubscriptionButton } from "@/components/SubscriptionButton";
import { supabase } from "@/lib/supabase";

export default function MyAccount() {
  const { user, signOut } = useAuth();
  const { subscription, fetchSubscription } = useSubscription(user);

  const handleCancelSubscription = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) throw new Error("No active session. Please log in again.");

      const accessToken = session.access_token;
      const response = await fetch("/api/cancel", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to cancel subscription");
      alert(data.message);
      fetchSubscription();
    } catch (error) {
      console.error("Error canceling subscription:", error);
      alert("Failed to cancel subscription: " + (error instanceof Error ? error.message : "Unknown error"));
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

  const isFree = subscription.status !== "PREMIUM";
  const hasCancelAt = subscription.cancelAt !== null && subscription.cancelAt !== undefined;
  const isPremiumActive = subscription.status === "PREMIUM" && !hasCancelAt;
  const isPremiumCancelling =
    subscription.status === "PREMIUM" && hasCancelAt && subscription.cancelAt! > new Date();
  const isPostCancellation =
    subscription.status === "PREMIUM" && hasCancelAt && subscription.cancelAt! <= new Date();

  const effectiveClicksLeft = isPostCancellation ? subscription.clicksLeft : subscription.clicksLeft;

  return (
    <div className="text-gray-200">
      <h1 className="text-2xl font-bold mb-4">My Account</h1>
      <p className="mb-4">Email: {user.email}</p>
      <p className="mb-4">
        {isFree || isPostCancellation
          ? `FREE Tier (${effectiveClicksLeft} clicks left)`
          : isPremiumActive
          ? `PREMIUM Tier - Active${subscription.currentPeriodEnd ? ` - Renews on ${subscription.currentPeriodEnd.toLocaleDateString()}` : ""}`
          : isPremiumCancelling
          ? `PREMIUM Tier - Cancelling on ${subscription.cancelAt!.toLocaleDateString()}`
          : ""}
      </p>
      <div className="space-y-4">
        {/* Show Subscribe button only if user is not subscribed */}
        {(isFree || isPostCancellation) && (
          <SubscriptionButton
            user={user}
            disabled={false}
            onSuccess={fetchSubscription}
          />
        )}
        {/* Show Unsubscribe button only if user is subscribed (active or cancelling) */}
        {(isPremiumActive || isPremiumCancelling) && (
          <button
            onClick={handleCancelSubscription}
            disabled={isPremiumCancelling}
            className={`px-4 py-2 bg-red-600 text-white rounded ${
              isPremiumCancelling ? "opacity-50 cursor-not-allowed" : "hover:bg-red-700"
            }`}
          >
            Unsubscribe
          </button>
        )}
        <button
          onClick={signOut}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Logout
        </button>
      </div>
    </div>
  );
}