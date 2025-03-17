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
import { TickerTapeItem, TopicItem } from "../types/api";

export default function Home() {
  const { user } = useAuth();
  const [pageMode, setPageMode] = useState<"cashtags" | "topics">("cashtags");
  const {
    tickerTapeData,
    setTickerTapeData,
    loading,
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
  } = useTickerData(user, pageMode);

  const [sortConfig, setSortConfig] = useState<{
    key: keyof TickerTapeItem | keyof TopicItem | null;
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

  const handleSort = (key: keyof TickerTapeItem | keyof TopicItem): void => {
    const direction =
      sortConfig.key === key && sortConfig.direction === "asc" ? "desc" : "asc";
    setSortConfig({ key, direction });

    if (pageMode === "cashtags") {
      const sortedData = [...(tickerTapeData as TickerTapeItem[])].sort((a, b) => {
        const aValue = a[key as keyof TickerTapeItem] ?? (typeof a[key as keyof TickerTapeItem] === "number" ? 0 : a[key as keyof TickerTapeItem]);
        const bValue = b[key as keyof TickerTapeItem] ?? (typeof b[key as keyof TickerTapeItem] === "number" ? 0 : b[key as keyof TickerTapeItem]);
        if (typeof aValue === "number" && typeof bValue === "number") {
          return direction === "asc" ? aValue - bValue : bValue - aValue;
        }
        if (typeof aValue === "string" && typeof bValue === "string") {
          return direction === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        }
        if (Array.isArray(aValue) && Array.isArray(bValue)) {
          const aLength = aValue.length;
          const bLength = bValue.length;
          return direction === "asc" ? aLength - bLength : bLength - aLength;
        }
        return 0;
      });
      setTickerTapeData(sortedData);
    } else if (pageMode === "topics") {
      const sortedData = [...(tickerTapeData as TopicItem[])].sort((a, b) => {
        const aValue = a[key as keyof TopicItem];
        const bValue = b[key as keyof TopicItem];
        if (key === "id" && typeof aValue === "number" && typeof bValue === "number") {
          return direction === "asc" ? aValue - bValue : bValue - aValue;
        }
        if (key === "topic" && typeof aValue === "string" && typeof bValue === "string") {
          return direction === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        }
        if (key === "trend" && Array.isArray(aValue) && Array.isArray(bValue)) {
          const aLength = aValue.length;
          const bLength = bValue.length;
          return direction === "asc" ? aLength - bLength : bLength - aLength;
        }
        return 0;
      });
      setTickerTapeData(sortedData);
    }
  };

  if (!user) {
    return (
      <div className="h-[600px] bg-gradient-to-b from-gray-900 to-gray-800 text-gray-200 flex flex-col items-center justify-center px-6 overflow-hidden">
        <div className="landing-hero text-center mb-4">
          <h1 className="text-3xl md:text-4xl font-bold text-[rgba(0,230,118,1)] mb-1 animate-fade-in">
            Cashtags
          </h1>
          <p className="text-sm md:text-md text-gray-300 max-w-lg mx-auto animate-slide-up">
            Real-time stock insights from social media.
          </p>
        </div>
        <div className="landing-pitch grid grid-cols-1 md:grid-cols-3 gap-3 max-w-3xl mb-4">
          <div className="pitch-card p-3">
            <h3 className="text-md font-semibold text-[rgba(0,230,118,1)] mb-1">Real-Time Trends</h3>
            <p className="text-xs text-gray-400">Live stock mentions & sentiment.</p>
          </div>
          <div className="pitch-card p-3">
            <h3 className="text-md font-semibold text-[rgba(0,230,118,1)] mb-1">AI Insights</h3>
            <p className="text-xs text-gray-400">Smart market summaries.</p>
          </div>
          <div className="pitch-card p-3">
            <h3 className="text-md font-semibold text-[rgba(0,230,118,1)] mb-1">Actionable Data</h3>
            <p className="text-xs text-gray-400">Price & volume charts.</p>
          </div>
        </div>
        <div className="landing-cta text-center">
          <p className="text-gray-300 mb-2 text-sm font-medium animate-slide-up">
            Start now
          </p>
          <AuthButtons />
        </div>
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
      <div className="header-container">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <h1 className="header-welcome">Welcome, {user.email}</h1>
            <p className="subscription-info">
              <span
                className={`tier-badge ${
                  isFree || isPostCancellation
                    ? "free"
                    : isPremiumActive
                    ? "premium"
                    : isPremiumCancelling
                    ? "cancelling"
                    : ""
                }`}
              >
                {isFree || isPostCancellation
                  ? "Free Tier"
                  : isPremiumActive
                  ? "Premium - Active"
                  : isPremiumCancelling
                  ? "Premium - Cancelling"
                  : ""}
              </span>
              {(isFree || isPostCancellation) && (
                <span>({effectiveClicksLeft} clicks left)</span>
              )}
              {isPremiumActive && subscription.currentPeriodEnd && (
                <span>Renews on {subscription.currentPeriodEnd.toLocaleDateString()}</span>
              )}
              {isPremiumCancelling && subscription.cancelAt && (
                <span>Ends on {subscription.cancelAt.toLocaleDateString()}</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {(isFree || isPostCancellation) && (
              <SubscriptionButton
                user={user}
                disabled={false}
                onSuccess={fetchSubscription}
                label="Upgrade to Premium"
              />
            )}
            {isPremiumCancelling && (
              <SubscriptionButton
                user={user}
                disabled={false}
                onSuccess={fetchSubscription}
                label="Reactivate"
              />
            )}
          </div>
        </div>
      </div>

      {/* Toggle Switch */}
      <div className="toggle-container mt-4 flex justify-center">
        <div className="toggle-switch">
          <button
            className={`toggle-btn ${pageMode === "cashtags" ? "active" : ""}`}
            onClick={() => setPageMode("cashtags")}
          >
            Cashtags
          </button>
          <button
            className={`toggle-btn ${pageMode === "topics" ? "active" : ""}`}
            onClick={() => setPageMode("topics")}
          >
            Topics
          </button>
        </div>
      </div>

      {errorMessage && <p className="text-red-500 mb-4">{errorMessage}</p>}
      <GenAISummary postsData={postsData} loading={postsLoading} selectedStock={selectedStock} pageMode={pageMode} />
      <TickerTape
        data={tickerTapeData}
        loading={loading}
        onTickerClick={handleTickerClick}
        onSort={handleSort}
        sortConfig={sortConfig}
        user={user}
        pageMode={pageMode}
      />
      {pageMode === "cashtags" && (
        <StockOverview
          data={{ marketCanvas: marketCanvasData, stockLedger: stockLedgerData }}
          selectedStock={selectedStock}
          loading={stockLedgerLoading}
        />
      )}
      <PostViewer
        data={postsData}
        loading={postsLoading}
        selectedStock={selectedStock}
        user={user}
      />
    </div>
  );
}