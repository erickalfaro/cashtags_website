// app/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth, useTickerData } from "../lib/hooks";
import { AuthButtons } from "../components/AuthButtons";
import { SubscriptionButton } from "../components/SubscriptionButton";
import { TickerTape } from "../components/TickerTape";
import { StockOverview } from "../components/StockOverview";
import { PostViewer } from "../components/PostViewer";
import GenAISummary from "@/components/GenAISummary";
import { TickerTapeItem, TopicItem } from "../types/api";
import ReactMarkdown from "react-markdown";

// Mock Data for Cashtags (unchanged)
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

// Mock Data for Topics (unchanged)
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

// Define funny headlines for each cashtag with proper bolding
const cashtagHeadlines: { [key: string]: string } = {
  AAPL: `
➤ **Tech Leap:** Apple’s iBrain Implant Hits Stores, Stock Soars as Pre-Orders Crash Servers Worldwide\n
➤ **Auto Ambition:** Leaked iCar Specs Promise 1,000-Mile Range, AAPL Jumps 15% in After-Hours Trading\n
➤ **Market Hype:** Holographic iPhone 15 Unveiled at Keynote, Analysts Predict 20% Revenue Spike\n
➤ **AI Craze:** Apple Time Machine Patent Filing Leaks, Shares Surge on Rumors of Subscription Model\n
➤ **Social Buzz:** iEye Wearable Tracks Consumer Habits, AAPL Gains 10% as Ad Revenue Potential Explodes
  `,
  TSLA: `
➤ **Tech Leap:** Tesla Cybertruck 2.0 Lands on Mars, TSLA Rockets 25% on Interplanetary Sales Hype\n
➤ **Auto Ambition:** Tesla Teleportation Pod Demo Wows Investors, Stock Pops 18% Despite Recall Rumors\n
➤ **Market Hype:** Tesla’s AI Driver Upgrade Boosts Autopilot Adoption, TSLA Climbs 12% Overnight\n
➤ **AI Craze:** Tesla Solar Roof Powers NYC Blackout Recovery, Shares Surge 15% on Grid Deal Talks\n
➤ **Social Buzz:** Orbital Gigafactory Announcement Sparks 20% Rally in TSLA as Musk Teases Zero-G Cars
  `,
  NVDA: `
➤ **Tech Leap:** NVIDIA RTX 9090 Doubles as Crypto Miner, Stock Spikes 22% on Gaming-Mining Craze\n
➤ **Auto Ambition:** NVDA’s AI Chip Powers First Sentient Robot, Shares Jump 17% on Defense Contract Buzz\n
➤ **Market Hype:** NVIDIA Holographic Gaming Console Leaks, Analysts Boost Price Target as Stock Rises 13%\n
➤ **AI Craze:** NVDA Partners With SpaceX for Satellite GPUs, Stock Soars 19% on Cosmic Compute Bets\n
➤ **Social Buzz:** NVIDIA’s Quantum GPU Prototype Unveiled, NVDA Up 25% as Tech Giants Bid for Exclusivity
  `,
  GOOGL: `
➤ **Tech Leap:** Google’s Mind-Reading Search Algorithm Goes Live, GOOGL Climbs 14% on Ad Revenue Hopes\n
➤ **Auto Ambition:** Quantum Google Maps Predicts Traffic 10 Years Ahead, Stock Jumps 16% on Licensing Deals\n
➤ **Market Hype:** Google Buys Time Travel Startup, Shares Surge 20% as Investors Eye Future Ad Placements\n
➤ **AI Craze:** Android Brain OS Syncs With Humans, GOOGL Gains 12% on Wearable Tech Breakthrough\n
➤ **Social Buzz:** Google’s Weather Control AI Patent Sparks 18% Rally as Governments Line Up to Bid
  `,
  AMZN: `
➤ **Tech Leap:** Amazon Drone Army Delivers in 60 Seconds Flat, AMZN Soars 15% on Logistics Hype\n
➤ **Auto Ambition:** Bezos Unveils Amazon Teleport Hubs, Stock Pops 20% as Shipping Costs Vanish\n
➤ **Market Hype:** Prime Brain Chip Streams Movies to Your Mind, AMZN Up 13% on Subscription Surge\n
➤ **AI Craze:** Amazon Buys Half the Moon for Warehouses, Shares Jump 17% on Galactic Expansion\n
➤ **Social Buzz:** AWS Powers First AI President, AMZN Rockets 22% as Cloud Dominance Grows
  `,
};

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

  // Hooks for the landing page
  const [selectedMockCashtag, setSelectedMockCashtag] = useState<string | null>(null);
  const [summaryLines, setSummaryLines] = useState<string[]>([]); // Array of lines
  const [currentLineIndex, setCurrentLineIndex] = useState<number>(0); // Track the current streaming line
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null); // Ref to store interval ID

  const [sortConfig, setSortConfig] = useState<{
    key: keyof TickerTapeItem | keyof TopicItem | null;
    direction: "asc" | "desc";
  }>({
    key: null,
    direction: "asc",
  });

  // Streaming effect for summary with blinking cursor at the end of the current line
  useEffect(() => {
    if (!user && selectedMockCashtag) {
      // Clean up any existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      // Reset state for a new stream
      setSummaryLines([]);
      setCurrentLineIndex(0);
      setIsStreaming(true);

      // Use the specific headlines for the selected cashtag, or fallback to a generic message
      const selectedHeadlines = cashtagHeadlines[selectedMockCashtag] || `
➤ **Notice:** No headlines available for ${selectedMockCashtag}. Please select another cashtag.
      `;

      // Split the headlines into an array of lines and initialize summaryLines with empty strings
      const lines = selectedHeadlines.trim().split("\n");
      setSummaryLines(Array(lines.length).fill("")); // Initialize with empty strings for all lines

      let charIndex = 0;
      let lineIndex = 0;

      const streamSummary = () => {
        if (lineIndex < lines.length) {
          const currentLine = lines[lineIndex];
          if (charIndex < currentLine.length) {
            // Stream the current line character by character
            setSummaryLines((prev) => {
              const newLines = [...prev];
              newLines[lineIndex] = currentLine.slice(0, charIndex + 1);
              return newLines;
            });
            charIndex++;
          } else {
            // Move to the next line
            lineIndex++;
            setCurrentLineIndex(lineIndex);
            charIndex = 0;
          }
        } else {
          // Streaming complete
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          setIsStreaming(false);
        }
      };

      intervalRef.current = setInterval(streamSummary, 15);

      // Cleanup function to clear interval when cashtag changes or component unmounts
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          setIsStreaming(false); // Ensure streaming stops
        }
      };
    }
  }, [user, selectedMockCashtag]);

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
        const aValue =
          (a as TickerTapeItem)[key as keyof TickerTapeItem] ??
          (typeof (a as TickerTapeItem)[key as keyof TickerTapeItem] === "number"
            ? 0
            : (a as TickerTapeItem)[key as keyof TickerTapeItem]);
        const bValue =
          (b as TickerTapeItem)[key as keyof TickerTapeItem] ??
          (typeof (a as TickerTapeItem)[key as keyof TickerTapeItem] === "number"
            ? 0
            : (b as TickerTapeItem)[key as keyof TickerTapeItem]);

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
    } else {
      sortedData = [...tickerTapeData as TopicItem[]].sort((a, b) => {
        const aValue =
          (a as TopicItem)[key as keyof TopicItem] ??
          (typeof (a as TopicItem)[key as keyof TopicItem] === "number"
            ? 0
            : (a as TopicItem)[key as keyof TopicItem]);
        const bValue =
          (b as TopicItem)[key as keyof TopicItem] ??
          (typeof (b as TopicItem)[key as keyof TopicItem] === "number"
            ? 0
            : (b as TopicItem)[key as keyof TopicItem]);

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
    }

    setTickerTapeData(sortedData);
  };

  const handleMockTickerClick = (ticker: string) => {
    console.log(`Mock ticker clicked: ${ticker}`);
  };

  const handleMockCashtagClick = (cashtag: string) => {
    setSelectedMockCashtag(cashtag);
  };

  // Landing page for unauthenticated users
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
            onTickerClick={pageMode === "cashtags" ? handleMockCashtagClick : handleMockTickerClick}
            onSort={handleSort}
            sortConfig={sortConfig}
            user={null}
            pageMode={pageMode}
          />
        </div>

        {/* AI Summary Section */}
        <div className="w-full max-w-4xl mb-6">
          <div className="container bg-gradient-to-br from-gray-800 to-gray-900 border-[rgba(0,230,118,0.2)] shadow-xl">
            <div className="container-header">
              <span style={{ color: "rgba(0, 230, 118)" }}>
                AI Summary{selectedMockCashtag ? ` for $${selectedMockCashtag}` : ""}
              </span>
            </div>
            <div className="container-content p-5 text-sm text-left no-scrollbar">
              {selectedMockCashtag ? (
                <div className="text-gray-300 w-full relative">
                  {summaryLines.map((line, index) => (
                    <div key={index} className="flex items-baseline">
                      <ReactMarkdown>{line}</ReactMarkdown>
                      {isStreaming && index === currentLineIndex && (
                        <span className="inline-block animate-blink text-[rgba(0,230,118,1)] ml-1">
                          █
                        </span>
                      )}
                    </div>
                  ))}
                  {summaryLines.length === 0 && <span>Generating summary...</span>}
                </div>
              ) : (
                <div className="animated-placeholder text-center">
                  <span>Click a Cashtag</span>
                </div>
              )}
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
          <div className="relative aspect-video rounded-lg overflow-hidden shadow-2xl animate-fade-in">
            <iframe
              src="https://www.youtube.com/embed/dQw4w9WgXcQ"
              title="Cashtags Demo Video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            ></iframe>
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