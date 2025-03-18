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

// Mock Data for Cashtags
const mockCashtagData: TickerTapeItem[] = [
  {
    id: 1,
    cashtag: "AAPL",
    prev_open: 175.50,
    prev_eod: 176.20,
    latest_price: 178.90,
    chng: 1.53,
    trend: [175, 176, 177, 178, 178.90],
    key: "mock-1",
  },
  {
    id: 2,
    cashtag: "TSLA",
    prev_open: 240.00,
    prev_eod: 245.10,
    latest_price: 250.30,
    chng: 2.12,
    trend: [240, 242, 245, 248, 250.30],
    key: "mock-2",
  },
  {
    id: 3,
    cashtag: "NVDA",
    prev_open: 420.75,
    prev_eod: 425.00,
    latest_price: 430.20,
    chng: 1.22,
    trend: [420, 422, 425, 428, 430.20],
    key: "mock-3",
  },
  {
    id: 4,
    cashtag: "GOOGL",
    prev_open: 135.20,
    prev_eod: 136.80,
    latest_price: 138.50,
    chng: 1.24,
    trend: [135, 136, 137, 138, 138.50],
    key: "mock-4",
  },
  {
    id: 5,
    cashtag: "AMZN",
    prev_open: 127.90,
    prev_eod: 129.30,
    latest_price: 131.10,
    chng: 1.39,
    trend: [127, 128, 129, 130, 131.10],
    key: "mock-5",
  },
];

// Mock Data for Topics
const mockTopicData: TopicItem[] = [
  {
    id: 1,
    topic: "AI Revolution",
    trend: [10, 15, 20, 25, 30],
    key: "mock-topic-1",
  },
  {
    id: 2,
    topic: "Electric Vehicles",
    trend: [8, 12, 18, 22, 28],
    key: "mock-topic-2",
  },
  {
    id: 3,
    topic: "Crypto Boom",
    trend: [5, 10, 15, 20, 25],
    key: "mock-topic-3",
  },
  {
    id: 4,
    topic: "Tech Earnings",
    trend: [12, 14, 16, 18, 20],
    key: "mock-topic-4",
  },
  {
    id: 5,
    topic: "Green Energy",
    trend: [7, 9, 11, 13, 15],
    key: "mock-topic-5",
  },
];

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
  
    let sortedData: (TickerTapeItem | TopicItem)[];
    
    if (pageMode === "cashtags") {
      sortedData = [...tickerTapeData as TickerTapeItem[]].sort((a, b) => {
        const aValue = (a as TickerTapeItem)[key as keyof TickerTapeItem] ?? 
                       (typeof (a as TickerTapeItem)[key as keyof TickerTapeItem] === "number" ? 0 : (a as TickerTapeItem)[key as keyof TickerTapeItem]);
        const bValue = (b as TickerTapeItem)[key as keyof TickerTapeItem] ?? 
                       (typeof (b as TickerTapeItem)[key as keyof TickerTapeItem] === "number" ? 0 : (b as TickerTapeItem)[key as keyof TickerTapeItem]);
  
        if (typeof aValue === "number" && typeof bValue === "number") {
          return direction === "asc" ? aValue - bValue : bValue - aValue;
        }
        if (typeof aValue === "string" && typeof bValue === "string") {
          return direction === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(bValue);
        }
        if (Array.isArray(aValue) && Array.isArray(bValue)) {
          const aLength = aValue.length;
          const bLength = bValue.length;
          return direction === "asc" ? aLength - bLength : bLength - aLength;
        }
        return 0;
      });
    } else {
      sortedData = [...tickerTapeData as TopicItem[]].sort((a, b) => {
        const aValue = (a as TopicItem)[key as keyof TopicItem] ?? 
                       (typeof (a as TopicItem)[key as keyof TopicItem] === "number" ? 0 : (a as TopicItem)[key as keyof TopicItem]);
        const bValue = (b as TopicItem)[key as keyof TopicItem] ?? 
                       (typeof (b as TopicItem)[key as keyof TopicItem] === "number" ? 0 : (b as TopicItem)[key as keyof TopicItem]);
  
        if (typeof aValue === "number" && typeof bValue === "number") {
          return direction === "asc" ? aValue - bValue : bValue - aValue;
        }
        if (typeof aValue === "string" && typeof bValue === "string") {
          return direction === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(bValue);
        }
        if (Array.isArray(aValue) && Array.isArray(bValue)) {
          const aLength = aValue.length;
          const bLength = bValue.length;
          return direction === "asc" ? aLength - bLength : bLength - aLength;
        }
        return 0;
      });
    }
  
    setTickerTapeData(sortedData);
  };

  const handleMockTickerClick = (ticker: string) => {
    console.log(`Mock ticker clicked: ${ticker}`);
  };

// app/page.tsx (partial update for !user block)
if (!user) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-gray-200 flex flex-col items-center justify-center px-5 py-10 overflow-hidden">
      {/* Hero Section */}
      <div className="landing-hero text-center mb-6 animate-fade-in">
        <h1 className="text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-[rgba(0,230,118,1)] to-[rgba(0,255,130,1)] bg-clip-text text-transparent mb-4">
          Cashtags Unleashed
        </h1>
        <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto animate-slide-up">
          Dive into real-time stock insights powered by AI, trending cashtags, and hot topics from the social sphere.
        </p>
      </div>

      {/* Trending Section with Mock Data */}
      <div className="w-full max-w-4xl mb-2">
        {/* Reduced from mb-6 to mb-2 */}
        <div className="toggle-container flex justify-center mb-5">
          <div className="toggle-switch">
            <button
              className={`toggle-btn ${pageMode === "cashtags" ? "active" : ""}`}
              onClick={() => setPageMode("cashtags")}
            >
              Trending Cashtags
            </button>
            <button
              className={`toggle-btn ${pageMode === "topics" ? "active" : ""}`}
              onClick={() => setPageMode("topics")}
            >
              Trending Topics
            </button>
          </div>
        </div>
        <TickerTape
          data={pageMode === "cashtags" ? mockCashtagData : mockTopicData}
          loading={false}
          onTickerClick={handleMockTickerClick}
          onSort={handleSort}
          sortConfig={sortConfig}
          user={null}
          pageMode={pageMode}
        />
      </div>

      {/* AI Summary Teaser */}
      <div className="w-full max-w-2xl mb-6">
        <div className="container bg-gradient-to-br from-gray-800 to-gray-900 border-[rgba(0,230,118,0.2)] shadow-xl">
          <div className="container-header">
            <span style={{ color: "rgba(0, 230, 118)" }}>AI-Powered Insights</span>
          </div>
          <div className="container-content p-5 text-sm">
            <p className="text-gray-300">
              - **Market Buzz:** AI instantly summarizes social sentiment for any stock or topic.<br />
              - **Real-Time Edge:** Get concise, actionable insights in seconds.<br />
              - **Unlock More:** Sign in to see full summaries and dive deeper!
            </p>
          </div>
        </div>
      </div>

      {/* CTA (Login Prompt) */}
      <div className="landing-cta text-center mb-6">
        <p className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-[rgba(0,230,118,1)] to-[rgba(0,255,130,1)] bg-clip-text text-transparent mb-4 animate-slide-up">
          Sign Up and Get Access
        </p>
        <div className="flex justify-center gap-4">
          <AuthButtons />
        </div>
      </div>

      {/* Video Embed */}
      <div className="w-full max-w-3xl">
        <div className="relative aspect-video bg-gradient-to-br bg-gray-900 rounded-lg overflow-hidden shadow-2xl animate-fade-in">
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[rgba(0,230,118,0.1)] to-gray-900">
            <p className="text-gray-400 text-lg font-semibold">
              Video Coming Soon: See Cashtags in Action!
            </p>
          </div>
          <div className="absolute top-4 left-4 bg-[rgba(0,230,118,0.9)] text-white px-3 py-1 rounded-full text-sm font-medium animate-scale-in">
            Watch Now
          </div>
        </div>
      </div>
    </div>
  );
}

  // Authenticated user content (unchanged)
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