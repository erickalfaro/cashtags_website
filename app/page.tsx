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
    prev_open: 205.20,
    prev_eod: 207.10,
    latest_price: 209.30,
    chng: 0.74,
    trend: [
      60, 62, 65, 63, 61, 60, 62, 64, 66, 68,
      70, 72, 75, 78, 80, 82, 85, 83, 80, 77,
      78, 80, 83, 87, 90, 92, 91, 89, 88, 87
    ],
    key: "mock-1",
  },
  {
    id: 2,
    cashtag: "TSLA",
    prev_open: 245.80,
    prev_eod: 242.50,
    latest_price: 246.90,
    chng: 1.40,
    trend: [
      40, 45, 50, 55, 60, 65, 70, 75, 80, 85,
      90, 88, 85, 80, 75, 70, 65, 60, 55, 50,
      52, 55, 60, 65, 70, 75, 80, 78, 75, 72
    ],
    key: "mock-2",
  },
  {
    id: 3,
    cashtag: "NVDA",
    prev_open: 95.60,
    prev_eod: 97.80,
    latest_price: 99.20,
    chng: 1.12,
    trend: [
      30, 32, 35, 38, 40, 42, 45, 47, 46, 45,
      48, 52, 55, 58, 62, 65, 68, 70, 72, 75,
      73, 70, 68, 65, 68, 72, 75, 78, 80, 82
    ],
    key: "mock-3",
  },
  {
    id: 4,
    cashtag: "GOOGL",
    prev_open: 152.40,
    prev_eod: 153.10,
    latest_price: 154.20,
    chng: 0.69,
    trend: [
      25, 26, 27, 28, 30, 32, 33, 34, 35, 36,
      38, 40, 42, 43, 42, 41, 40, 42, 44, 46,
      48, 50, 52, 54, 55, 56, 55, 54, 53, 52
    ],
    key: "mock-4",
  },
  {
    id: 5,
    cashtag: "AMZN",
    prev_open: 178.90,
    prev_eod: 180.40,
    latest_price: 182.10,
    chng: 0.92,
    trend: [
      50, 48, 46, 45, 47, 50, 53, 55, 57, 58,
      60, 62, 65, 68, 70, 72, 70, 68, 65, 62,
      64, 68, 72, 75, 78, 80, 82, 85, 87, 88
    ],
    key: "mock-5",
  },
];

// Mock Data for Topics (unchanged)
const mockTopicData: TopicItem[] = [
  {
    id: 1,
    topic: "AI Revolution",
    trend: [
      50, 52, 55, 58, 60, 63, 65, 68, 70, 73,
      75, 74, 72, 70, 71, 73, 76, 80, 83, 85,
      88, 90, 87, 85, 82, 80, 79, 78, 77, 76
    ],
    key: "mock-topic-1",
  },
  {
    id: 2,
    topic: "Electric Vehicles",
    trend: [
      40, 42, 45, 48, 50, 55, 60, 62, 61, 60,
      58, 57, 59, 63, 68, 70, 72, 75, 78, 80,
      82, 80, 77, 74, 73, 75, 76, 78, 79, 80
    ],
    key: "mock-topic-2",
  },
  {
    id: 3,
    topic: "Crypto Boom",
    trend: [
      70, 68, 65, 62, 60, 63, 67, 72, 78, 85,
      90, 88, 82, 75, 70, 68, 72, 78, 85, 90,
      95, 92, 88, 83, 80, 77, 75, 73, 72, 70
    ],
    key: "mock-topic-3",
  },
  {
    id: 4,
    topic: "Tech Earnings",
    trend: [
      55, 56, 58, 60, 62, 61, 60, 59, 58, 60,
      63, 67, 70, 74, 78, 80, 79, 77, 75, 73,
      72, 74, 76, 78, 80, 82, 83, 84, 85, 86
    ],
    key: "mock-topic-4",
  },
  {
    id: 5,
    topic: "Green Energy",
    trend: [
      45, 48, 50, 52, 55, 58, 60, 62, 65, 68,
      70, 72, 75, 73, 71, 70, 72, 74, 76, 78,
      80, 82, 84, 85, 83, 81, 80, 79, 78, 77
    ],
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

const topicHeadlines: { [key: string]: string } = {
  "AI Revolution": `
➤ **Tech Leap:** AI breakthroughs dominate headlines as companies race to deploy sentient assistants.\n
➤ **Market Hype:** AI startups see 200% funding surge, driving investor frenzy.\n
➤ **Social Buzz:** Twitter abuzz with AI ethics debates, mentions up 50% this week.\n
➤ **Industry Shift:** Major firms pivot to AI-first strategies, reshaping tech landscape.\n
➤ **Future Bets:** Analysts predict AI will add $15T to global economy by 2030.
  `,
  "Electric Vehicles": `
➤ **Innovation Surge:** New EV battery tech promises 500-mile range, stocks soar.\n
➤ **Market Hype:** EV sales outpace gas cars in Q1, sparking 20% rally in sector.\n
➤ **Social Buzz:** Viral videos of self-driving EVs flood TikTok, mentions triple.\n
➤ **Policy Push:** Governments offer $5B in EV subsidies, boosting adoption.\n
➤ **Competition Heat:** Tesla vs. Rivian rivalry heats up with new model leaks.
  `,
  "Crypto Boom": `
➤ **Price Surge:** Bitcoin hits $100K, igniting a 30% crypto market rally.\n
➤ **Social Buzz:** #CryptoBoom trends as influencers tout altcoin gains.\n
➤ **Regulation Talk:** SEC hints at crypto ETF approval, mentions spike 40%.\n
➤ **Tech Leap:** New blockchain speeds up transactions, drawing investor hype.\n
➤ **Market Mood:** Sentiment turns bullish with $2B inflows in 24 hours.
  `,
  "Tech Earnings": `
➤ **Earnings Beat:** FAANG stocks crush estimates, up 15% post-earnings.\n
➤ **Social Buzz:** Twitter lights up with #TechEarnings memes, mentions double.\n
➤ **Growth Story:** Cloud revenue drives 25% profit gains across sector.\n
➤ **Analyst Take:** Price targets raised as tech giants signal AI focus.\n
➤ **Market Hype:** Investors pile in, pushing Nasdaq to record highs.
  `,
  "Green Energy": `
➤ **Tech Leap:** Solar panel efficiency hits 40%, stocks jump 10%.\n
➤ **Policy Win:** $10B green energy bill passes, mentions soar 60%.\n
➤ **Social Buzz:** #GreenEnergy trends as activists praise wind farm boom.\n
➤ **Industry Shift:** Oil giants pivot to renewables, sparking debate.\n
➤ **Future Bets:** Analysts see green tech doubling market cap by 2028.
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
  const [selectedMockItem, setSelectedMockItem] = useState<string | null>(null); // Renamed for clarity
  const [summaryLines, setSummaryLines] = useState<string[]>([]);
  const [currentLineIndex, setCurrentLineIndex] = useState<number>(0);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const [sortConfig, setSortConfig] = useState<{
    key: keyof TickerTapeItem | keyof TopicItem | null;
    direction: "asc" | "desc";
  }>({
    key: null,
    direction: "asc",
  });

  // Streaming effect for mock summary
  useEffect(() => {
    if (!user && selectedMockItem) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      setSummaryLines([]);
      setCurrentLineIndex(0);
      setIsStreaming(true);

      const headlines = pageMode === "cashtags" ? cashtagHeadlines : topicHeadlines;
      const selectedHeadlines = headlines[selectedMockItem] || `
➤ **Notice:** No headlines available for ${selectedMockItem}. Please select another item.
      `;

      const lines = selectedHeadlines.trim().split("\n");
      setSummaryLines(Array(lines.length).fill(""));

      let charIndex = 0;
      let lineIndex = 0;

      const streamSummary = () => {
        if (lineIndex < lines.length) {
          const currentLine = lines[lineIndex];
          if (charIndex < currentLine.length) {
            setSummaryLines((prev) => {
              const newLines = [...prev];
              newLines[lineIndex] = currentLine.slice(0, charIndex + 1);
              return newLines;
            });
            charIndex++;
          } else {
            lineIndex++;
            setCurrentLineIndex(lineIndex);
            charIndex = 0;
          }
        } else {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          setIsStreaming(false);
        }
      };

      intervalRef.current = setInterval(streamSummary, 10);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          setIsStreaming(false);
        }
      };
    }
  }, [user, selectedMockItem, pageMode]); // Added pageMode to dependencies

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

  const handleMockItemClick = (item: string) => {
    console.log(`Mock item clicked: ${item}`);
    setSelectedMockItem(item); // Use unified handler for both cashtags and topics
  };

  // Landing page for unauthenticated users
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0D1117] via-[#111827] to-[#161B22] text-gray-300 px-4 pt-6 pb-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Hero Section */}
          <div className="text-center pt-0 pb-0 landing-hero">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold mb-6 bg-gradient-to-r from-[rgba(0,230,118,1)] via-[rgba(0,240,125,1)] to-[rgba(0,255,130,1)] bg-clip-text text-transparent animate-fade-in leading-snug pb-2">
              Cashtags AI
            </h1>
            <p className="text-lg sm:text-xl lg:text-2xl text-gray-400 max-w-3xl mx-auto mb-2 animate-slide-up animation-delay-200">
              Stay ahead of the market. Get AI-powered summaries of trending stock news and topics in real-time.
            </p>
          </div>

          {/* Interactive Demo Section */}
          <div className="bg-gradient-to-b from-gray-800/40 to-gray-900/60 border border-[rgba(48,54,61,0.7)] rounded-xl shadow-xl p-4 space-y-3 animate-fade-in animation-delay-400">
            <h2 className="text-3xl font-bold text-center text-white mb-2">Try It Live</h2>
            <p className="text-center text-gray-400 mb-3">Click a Cashtag or Topic below to see a sample AI summary.</p>

            {/* Toggle Switch */}
            <div className="flex justify-center mb-2">
              <div className="toggle-switch inline-flex rounded-full border border-[rgba(48,54,61,0.5)] bg-[#161B22] p-1 shadow-md">
                <button
                  className={`px-5 py-2 text-sm font-semibold rounded-full transition-all duration-300 border ${
                    pageMode === "cashtags"
                      ? "text-[rgba(0,230,118,1)] border-[rgba(0,230,118,0.7)] bg-gray-700/30"
                      : "text-gray-400 hover:text-[rgba(0,230,118,1)] border-transparent"
                  }`}
                  onClick={() => setPageMode("cashtags")}
                >
                  Trending Cashtags
                </button>
                <button
                  className={`px-5 py-2 text-sm font-semibold rounded-full transition-all duration-300 border ${
                    pageMode === "topics"
                      ? "text-[rgba(0,230,118,1)] border-[rgba(0,230,118,0.7)] bg-gray-700/30"
                      : "text-gray-400 hover:text-[rgba(0,230,118,1)] border-transparent"
                  }`}
                  onClick={() => setPageMode("topics")}
                >
                  Trending Topics
                </button>
              </div>
            </div>

            {/* Ticker Tape (Demo) */}
            <div className="h-[295px] overflow-hidden">
              <TickerTape
                data={pageMode === "cashtags" ? mockCashtagData : mockTopicData}
                loading={false}
                onTickerClick={handleMockItemClick} // Unified handler
                onSort={handleSort}
                sortConfig={sortConfig}
                user={null}
                pageMode={pageMode}
              />
            </div>

            {/* AI Summary Section (Demo) */}
            <div className="container bg-[#11151C] border border-[rgba(48,54,61,0.6)] rounded-lg shadow-md">
              <div className="container-header bg-gradient-to-r from-gray-700/50 to-gray-800/50">
                <span className="font-semibold text-[rgba(0, 230, 118, 1)]">AI Summary</span>
                {selectedMockItem ? (
                  <span className="text-gray-300">
                    {pageMode === "cashtags" ? ` for $${selectedMockItem}` : ` for ${selectedMockItem}`}
                  </span>
                ) : ""}
              </div>
              <div className="container-content p-4 text-sm text-left no-scrollbar h-[180px] overflow-y-auto">
                {selectedMockItem ? (
                  <div className="text-gray-300 w-full relative space-y-1">
                    {summaryLines.map((line, index) => (
                      <div key={index} className="prose prose-sm prose-invert max-w-none flex items-baseline">
                        <ReactMarkdown>{line}</ReactMarkdown>
                        {isStreaming && index === currentLineIndex && (
                          <span className="inline-block animate-blink text-[rgba(0,230,118,1)] ml-1 self-center">▋</span>
                        )}
                      </div>
                    ))}
                    {summaryLines.length === 0 && !isStreaming && <span>Generating summary...</span>}
                  </div>
                ) : (
                  <div className="animated-placeholder flex items-center justify-center h-full text-gray-500">
                    <span>Click a Cashtag or Topic above to see a sample summary</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Call-to-Action Section */}
          <div className="bg-gradient-to-r from-[#111827] via-[#181f2b] to-[#111827] border-y border-white/10 py-10 text-center landing-cta animate-slide-up animation-delay-600">
            <AuthButtons />
          </div>

          {/* Video Embed */}
          <div className="w-full max-w-4xl mx-auto mt-6 animate-fade-in animation-delay-800">
            <h3 className="text-2xl font-semibold text-center text-white mb-4">See It In Action</h3>
            <div className="relative aspect-video rounded-xl overflow-hidden shadow-2xl border border-[rgba(48,54,61,0.5)]">
              <iframe
                src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=0&modestbranding=1&rel=0"
                title="Cashtags Demo Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute top-0 left-0 w-full h-full"
              ></iframe>
            </div>
          </div>
        </div>
        <style jsx global>{`
          .animation-delay-200 { animation-delay: 0.2s; }
          .animation-delay-400 { animation-delay: 0.4s; }
          .animation-delay-600 { animation-delay: 0.6s; }
          .animation-delay-800 { animation-delay: 0.8s; }
          .animate-fade-in { animation-fill-mode: backwards; }
          .animate-slide-up { animation-fill-mode: backwards; }
          .prose strong { color: #00e676; }
        `}</style>
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

      <div className="mt-4 flex justify-center">
        {/* Keep container style */}
        <div className="inline-flex rounded-full border border-[rgba(48,54,61,0.5)] bg-[#161B22] p-1 shadow-md">
          <button
            // New Active/Inactive Styles
            className={`px-5 py-2 text-sm font-semibold rounded-full transition-all duration-300 border ${ // Added base 'border'
              pageMode === "cashtags"
                ? "text-[rgba(0,230,118,1)] border-[rgba(0,230,118,0.7)] bg-gray-700/30" // Active: Green text, Green border, subtle bg tint
                : "text-gray-400 hover:text-[rgba(0,230,118,1)] border-transparent" // Inactive: Gray text, transparent border
            }`}
            onClick={() => setPageMode("cashtags")}
          >
            Cashtags
          </button>
          <button
            // New Active/Inactive Styles
            className={`px-5 py-2 text-sm font-semibold rounded-full transition-all duration-300 border ${ // Added base 'border'
              pageMode === "topics"
                ? "text-[rgba(0,230,118,1)] border-[rgba(0,230,118,0.7)] bg-gray-700/30" // Active: Green text, Green border, subtle bg tint
                : "text-gray-400 hover:text-[rgba(0,230,118,1)] border-transparent" // Inactive: Gray text, transparent border
            }`}
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