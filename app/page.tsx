// app/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useAuth, useTickerData } from "../lib/hooks";
import { AuthButtons } from "../components/AuthButtons";
import { SubscriptionButton } from "../components/SubscriptionButton";
import { RefreshButton } from "../components/RefreshButton";
import { TickerTape } from "../components/TickerTape";
import { StockOverview } from "../components/StockOverview"; // New import
import { PostViewer } from "../components/PostViewer";
import { GenAISummary } from "../components/GenAISummary";
import { TickerTapeItem } from "../types/api";

export default function Home() {
  const { user } = useAuth();
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
      <div className="header-controls flex flex-wrap items-center gap-4 mb-6">
        <h1 className="text-xl font-semibold flex-grow">Welcome, {user.email}</h1>
        <div className="flex items-center gap-4">
          <RefreshButton onClick={fetchTickerTapeData} />
          {(isFree || isPostCancellation) && (
            <SubscriptionButton
              user={user}
              disabled={false}
              onSuccess={fetchSubscription}
            />
          )}
        </div>
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
      <StockOverview
        data={{ marketCanvas: marketCanvasData, stockLedger: stockLedgerData }}
        selectedStock={selectedStock}
        loading={stockLedgerLoading}
      />
      <GenAISummary postsData={postsData} loading={postsLoading} selectedStock={selectedStock} />
      <PostViewer data={postsData} loading={postsLoading} selectedStock={selectedStock} />
    </div>
  );
}