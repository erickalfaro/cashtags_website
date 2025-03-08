// app/page.tsx
"use client";

import { useState } from "react";
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
  } = useTickerData(user);

  const [sortConfig, setSortConfig] = useState<{
    key: keyof TickerTapeItem | null;
    direction: "asc" | "desc";
  }>({
    key: null,
    direction: "asc",
  });

  const handleSort = (key: keyof TickerTapeItem): void => {
    const direction =
      sortConfig.key === key && sortConfig.direction === "asc" ? "desc" : "asc";
    setSortConfig({ key, direction });

    const sortedData = [...tickerTapeData].sort((a, b) => {
      const aValue = a[key] ?? 0; // Fallback for null/undefined
      const bValue = b[key] ?? 0;
      if (direction === "asc") {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      }
      return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
    });
    setTickerTapeData(sortedData); // Persist the sorted data
  };

  if (!user) {
    return (
      <div className="p-6 max-w-4xl mx-auto bg-gray-900 text-gray-200 min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Please Log In</h1>
        <AuthButtons />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto bg-gray-900 text-gray-200 min-h-screen relative">
      <div className="header-controls">
        <h1>Welcome, {user.email}</h1>
        <RefreshButton onClick={fetchTickerTapeData} />
        {subscription.status === "FREE" && <SubscriptionButton user={user} />}
        <button onClick={signOut} className="logout-btn">
          Logout
        </button>
      </div>
      <p className="mb-4">
        Subscription: {subscription.status}{" "}
        {subscription.status === "FREE" ? `(${subscription.clicksLeft} clicks left)` : ""}
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