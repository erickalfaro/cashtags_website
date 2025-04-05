// app/my-account/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useAuth, useSubscription } from "@/lib/hooks";
import { SubscriptionButton } from "@/components/SubscriptionButton";
import { supabase } from "@/lib/supabase";

export default function MyAccount() {
  const { user, signOut } = useAuth();
  const { subscription, fetchSubscription } = useSubscription(user);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchSubscription();
  }, [user, fetchSubscription]);

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

  const handleCustomerPortal = async () => {
    if (!user) return;

    setPortalLoading(true);
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
      if (!response.ok) {
        throw new Error(responseData.error || "Failed to generate portal link.");
      }

      window.location.href = responseData.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setPortalLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0D1117] to-[#1A1F2A] text-gray-300 pt-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-[#161B22] p-6 rounded-lg border border-[rgba(48,54,61,0.5)] shadow-md">
            <h2 className="text-xl font-semibold text-[rgba(0,230,118,1)] mb-2">Authentication Required</h2>
            <p className="text-gray-400">Please sign in to access your account settings and subscription details.</p>
          </div>
        </div>
      </div>
    );
  }

  const isFree = subscription.status !== "PREMIUM";
  const hasCancelAt = subscription.cancelAt !== null && subscription.cancelAt !== undefined;
  const isPremiumActive = subscription.status === "PREMIUM" && !hasCancelAt;
  const isPremiumCancelling = subscription.status === "PREMIUM" && hasCancelAt && subscription.cancelAt! > new Date();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0D1117] to-[#1A1F2A] text-gray-300 pt-20 px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-[#161B22] p-6 rounded-lg border border-[rgba(48,54,61,0.5)] shadow-md flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Account Settings</h1>
            <p className="text-sm text-gray-400 mt-1">Control your Cashtags experience</p>
          </div>
          <div className="hidden md:block w-16 h-16 bg-[rgba(0,230,118,0.1)] rounded-full blur-2xl"></div>
        </div>

        {/* Profile Section */}
        <div className="bg-[#161B22] p-6 rounded-lg border border-[rgba(48,54,61,0.5)] shadow-md">
          <h2 className="text-lg font-semibold text-white mb-4">Profile</h2>
          <div className="space-y-2">
            <p className="text-sm text-gray-400">Email Address</p>
            <p className="text-white font-medium truncate">{user.email}</p>
          </div>
          <button
            onClick={signOut}
            className="mt-6 w-full py-2 bg-transparent border border-[rgba(255,85,85,0.7)] text-[rgba(255,85,85,1)] rounded-lg font-medium hover:bg-[rgba(255,85,85,0.2)] transition-colors duration-300 flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>

        {/* Subscription Section */}
        <div className="bg-[#161B22] p-6 rounded-lg border border-[rgba(48,54,61,0.5)] shadow-md">
          <h2 className="text-lg font-semibold text-white mb-4">Subscription</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Current Plan</span>
              <span
                className={`px-4 py-1 rounded-full text-sm font-medium ${
                  isFree
                    ? "bg-gray-600 text-gray-300"
                    : isPremiumActive
                    ? "bg-[rgba(0,230,118,0.9)] text-white"
                    : "bg-[rgba(255,202,40,0.9)] text-white"
                }`}
              >
                {isFree
                  ? "Free Plan"
                  : isPremiumActive
                  ? "Premium Plan"
                  : isPremiumCancelling
                  ? "Premium (Cancelling)"
                  : ""}
              </span>
            </div>
            <div className="text-sm text-gray-400">
              {isFree && (
                <p>
                  Clicks Remaining: <span className="text-white font-medium">{subscription.clicksLeft}</span>
                </p>
              )}
              {isPremiumActive && subscription.currentPeriodEnd && (
                <p>
                  Next Renewal: <span className="text-white font-medium">{subscription.currentPeriodEnd.toLocaleDateString()}</span>
                </p>
              )}
              {isPremiumCancelling && subscription.cancelAt && (
                <p>
                  Ends On: <span className="text-white font-medium">{subscription.cancelAt.toLocaleDateString()}</span>
                </p>
              )}
            </div>
            <div className="pt-4 space-y-3 border-t border-[rgba(48,54,61,0.5)]">
              {isFree ? (
                <SubscriptionButton
                  user={user}
                  onSuccess={fetchSubscription}
                  label="Upgrade to Premium ($10/month)"
                  disabled={false}
                />
              ) : (
                <>
                  <button
                    onClick={handleCustomerPortal}
                    disabled={portalLoading}
                    className={`w-full py-3 bg-[rgba(0,230,118,0.9)] text-white rounded-lg font-semibold hover:bg-[rgba(0,255,130,1)] transition-colors duration-300 ${
                      portalLoading ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {portalLoading ? "Loading..." : "Manage Subscription"}
                  </button>
                  {isPremiumActive && (
                    <button
                      onClick={handleCancel}
                      disabled={cancelLoading}
                      className={`w-full py-3 bg-transparent border border-gray-500 text-gray-300 rounded-lg font-semibold hover:bg-gray-700 transition-colors duration-300 ${
                        cancelLoading ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      {cancelLoading ? "Cancelling..." : "Cancel Subscription"}
                    </button>
                  )}
                  {isPremiumCancelling && (
                    <SubscriptionButton
                      user={user}
                      onSuccess={fetchSubscription}
                      label="Reactivate Subscription"
                      disabled={false}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-[rgba(255,85,85,0.1)] p-4 rounded-lg border border-[rgba(255,85,85,0.5)] text-[rgba(255,85,85,1)] text-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}