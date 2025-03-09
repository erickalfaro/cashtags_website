// app/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useAuth, useTickerData } from "../lib/hooks";
import { AuthButtons } from "../components/AuthButtons";
import { SubscriptionButton } from "../components/SubscriptionButton";
import { RefreshButton } from "../components/RefreshButton";
import { TickerTape } from "../components/TickerTape";
import { StockLedger } from "../components/StockLedger";
import { MarketCanvas } from "../components/MarketCanvas";
import { PostViewer } from "../components/PostViewer";
import { GenAISummary } from "../components/GenAISummary";
import { TickerTapeItem } from "../types/api";
import { supabase } from "../lib/supabase";

export default function Home() {
  const { user, signOut } = useAuth();
  const {
    tickerTapeData,
    setTickerTapeData,
    loading,
    fetchTickerTapeData,
    stockLedgerData,
    marketCanvasData,
    postsData,
    stockLedgerLoading,
    postsLoading,
    selectedStock,
    handleTickerClick,
    errorMessage,
    subscription,
    fetchSubscription,
  } = useTickerData(user);

  const [sortConfig, setSortConfig] = useState<{
    key: keyof TickerTapeItem | null;
    direction: "asc" | "desc";
  }>({
    key: null,
    direction: "asc",
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("success") === "true") {
      console.log("Stripe payment success detected, refreshing subscription...");
      fetchSubscription();
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [fetchSubscription]);

  const handleSort = (key: keyof TickerTapeItem): void => {
    const direction =
      sortConfig.key === key && sortConfig.direction === "asc" ? "desc" : "asc";
    setSortConfig({ key, direction });

    const sortedData = [...tickerTapeData].sort((a, b) => {
      const aValue = a[key] ?? (typeof a[key] === "number" ? 0 : a[key]);
      const bValue = b[key] ?? (typeof b[key] === "number" ? 0 : b[key]);

      if (typeof aValue === "number" && typeof bValue === "number") {
        return direction === "asc" ? aValue - bValue : bValue - aValue;
      }
      if (typeof aValue === "string" && typeof bValue === "string") {
        return direction === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      if (Array.isArray(aValue) && Array.isArray(bValue)) {
        const aLength = aValue.length;
        const bLength = bValue.length;
        return direction === "asc" ? aLength - bLength : bLength - aLength;
      }
      return 0;
    });
    setTickerTapeData(sortedData);
  };

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
      <div className="p-6 max-w-4xl mx-auto bg-gray-900 text-gray-200 min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Please Log In</h1>
        <AuthButtons />
      </div>
    );
  }

  // Determine subscription state with explicit null/undefined handling
  const isFree = subscription.status !== "PREMIUM";
  const hasCancelAt = subscription.cancelAt !== null && subscription.cancelAt !== undefined;
  const isPremiumActive = subscription.status === "PREMIUM" && !hasCancelAt;
  const isPremiumCancelling =
    subscription.status === "PREMIUM" && hasCancelAt && subscription.cancelAt! > new Date();
  const isPostCancellation =
    subscription.status === "PREMIUM" && hasCancelAt && subscription.cancelAt! <= new Date();

  // Adjust clicks for post-cancellation
  const effectiveClicksLeft = isPostCancellation ? subscription.clicksLeft : subscription.clicksLeft;

  return (
    <div className="p-6 max-w-4xl mx-auto bg-gray-900 text-gray-200 min-h-screen relative">
      <div className="header-controls">
        <h1>Welcome, {user.email}</h1>
        <RefreshButton onClick={fetchTickerTapeData} />
        <SubscriptionButton
          user={user}
          disabled={isPremiumActive} // Only greyed out for active PREMIUM
          onSuccess={fetchSubscription}
        />
        <button
          onClick={handleCancelSubscription}
          disabled={isFree || isPremiumCancelling || isPostCancellation} // Greyed out for FREE or cancelling/post-cancellation
          className={`px-4 py-2 bg-red-600 text-white rounded ${
            isFree || isPremiumCancelling || isPostCancellation ? "opacity-50 cursor-not-allowed" : "hover:bg-red-700"
          }`}
        >
          Unsubscribe
        </button>
        <button onClick={signOut} className="logout-btn">
          Logout
        </button>
      </div>
      <p className="mb-4">
        {isFree || isPostCancellation
          ? `FREE Tier (${effectiveClicksLeft} clicks left)`
          : isPremiumActive
          ? `PREMIUM Tier - Active${subscription.currentPeriodEnd ? ` - Renews on ${subscription.currentPeriodEnd.toLocaleDateString()}` : ""}`
          : isPremiumCancelling
          ? `PREMIUM Tier - Cancelling on ${subscription.cancelAt!.toLocaleDateString()}`
          : ""}
      </p>
      {errorMessage && <p className="text-red-500 mb-4">{errorMessage}</p>}
      <TickerTape
        data={tickerTapeData}
        loading={loading}
        onTickerClick={handleTickerClick}
        onSort={handleSort}
        sortConfig={sortConfig}
      />
      <MarketCanvas data={marketCanvasData} selectedStock={selectedStock} />
      <StockLedger data={stockLedgerData} loading={stockLedgerLoading} />
      <GenAISummary postsData={postsData} loading={postsLoading} selectedStock={selectedStock} />
      <PostViewer data={postsData} loading={postsLoading} selectedStock={selectedStock} />
    </div>
  );
}