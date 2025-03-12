// app/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useAuth, useTickerData } from "../lib/hooks";
import { AuthButtons } from "../components/AuthButtons";
import { SubscriptionButton } from "../components/SubscriptionButton";
import { TickerTape } from "../components/TickerTape";
import { StockOverview } from "../components/StockOverview";
import { PostViewer } from "../components/PostViewer";
import { GenAISummary } from "../components/GenAISummary";
import { TickerTapeItem } from "../types/api";

export default function Home() {
  const { user } = useAuth();
  const {
    tickerTapeData,
    setTickerTapeData,
    loading,
    // Remove fetchTickerTapeData from destructuring if not used here
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
      <div className="mb-6 bg-[#1e2529] rounded-sm shadow-xs p-3 transition-all duration-150 hover:bg-[#222a30]">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1">
          <h1 className="text-lg font-medium text-[#f5f5f5]">
            Welcome, {user.email}
          </h1>
          <div className="flex items-center gap-2">
            {(isFree || isPostCancellation) && (
              <SubscriptionButton
                user={user}
                disabled={false}
                onSuccess={fetchSubscription}
              />
            )}
            {isPremiumCancelling && (
              <SubscriptionButton
                user={user}
                disabled={false}
                onSuccess={fetchSubscription}
                label="Reactivate Subscription"
              />
            )}
          </div>
        </div>
        <p className="mt-1 text-sm font-regular text-[#b0bec5]">
          {isFree || isPostCancellation ? (
            <span>
              <span className="text-[#b0bec5]">Free Tier</span>
              <span className="text-[#b0bec5] ml-1">({effectiveClicksLeft} clicks left)</span>
            </span>
          ) : isPremiumActive ? (
            <span>
              <span className="italic text-[rgba(0,230,118,0.85)]">Premium</span>
              <span className="text-[#b0bec5] mx-1">Tier -</span>
              <span className="italic text-[rgba(0,230,118,0.85)]">Active</span>
              {subscription.currentPeriodEnd && (
                <span className="text-[#b0bec5] ml-1">
                  - Renews on {subscription.currentPeriodEnd.toLocaleDateString()}
                </span>
              )}
            </span>
          ) : isPremiumCancelling ? (
            <span>
              <span className="italic text-[rgba(0,230,118,0.85)]">Premium</span>
              <span className="text-[#b0bec5] mx-1">Tier -</span>
              <span className="italic text-[#ffca28]/80">Cancelling</span>
              <span className="text-[#b0bec5] ml-1">
                - on {subscription.cancelAt!.toLocaleDateString()}
              </span>
            </span>
          ) : null}
        </p>
      </div>
      {errorMessage && <p className="text-red-500 mb-4">{errorMessage}</p>}
      <GenAISummary postsData={postsData} loading={postsLoading} selectedStock={selectedStock} />
      <TickerTape
        data={tickerTapeData}
        loading={loading}
        onTickerClick={handleTickerClick}
        onSort={handleSort}
        sortConfig={sortConfig}
        user={user}
      />
      <StockOverview
        data={{ marketCanvas: marketCanvasData, stockLedger: stockLedgerData }}
        selectedStock={selectedStock}
        loading={stockLedgerLoading}
      />
      <PostViewer
        data={postsData}
        loading={postsLoading}
        selectedStock={selectedStock}
        user={user}
      />
    </div>
  );
}