// lib/hooks.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { supabase } from "./supabase";
import { debounce } from "./utils";
import {
  fetchTickerTapeData as apiFetchTickerTapeData,
  fetchStockLedgerData,
  fetchMarketCanvasData,
  fetchPostsData,
} from "./api";
import { TickerTapeItem, StockLedgerData, MarketCanvasData, PostData } from "../types/api";

// Subscription status interface
interface SubscriptionStatus {
  status: "FREE" | "PREMIUM";
  clicksLeft: number;
}

// Define the return type for useSubscription
interface SubscriptionData {
  subscription: SubscriptionStatus;
  setSubscription: React.Dispatch<React.SetStateAction<SubscriptionStatus>>;
  loading: boolean;
}

// Define the return type for useTickerData
export interface TickerData {
  tickerTapeData: TickerTapeItem[];
  setTickerTapeData: React.Dispatch<React.SetStateAction<TickerTapeItem[]>>;
  stockLedgerData: StockLedgerData;
  marketCanvasData: MarketCanvasData;
  postsData: PostData[];
  loading: boolean;
  stockLedgerLoading: boolean;
  postsLoading: boolean;
  selectedStock: string | null;
  fetchTickerTapeData: () => Promise<void>;
  handleTickerClick: (ticker: string) => void;
  errorMessage: string | null;
  subscription: SubscriptionStatus;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  const getBaseUrl = () => {
    if (typeof window !== "undefined") {
      return window.location.origin;
    }
    return process.env.NEXT_PUBLIC_BASE_URL || `https://${process.env.VERCEL_URL}` || "http://localhost:3000";
  };

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user ?? null);
    };
    fetchUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (event === "SIGNED_OUT") {
        router.push("/");
        router.refresh();
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  const signOut = async () => {
    try {
      console.log("Attempting to sign out...");
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      console.log("Sign out successful");
      setUser(null);
      const baseUrl = getBaseUrl();
      window.location.href = `${baseUrl}/`; // Hard redirect to ensure logout
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return { user, signOut };
}

export function useSubscription(user: User | null): SubscriptionData {
  const [subscription, setSubscription] = useState<SubscriptionStatus>({
    status: "FREE",
    clicksLeft: 10,
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchSubscription = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("user_subscriptions")
          .select("subscription_status")
          .eq("user_id", user.id)
          .single();

        if (error && error.code !== "PGRST116") throw error; // Ignore "no rows" error

        const status = data?.subscription_status || "FREE";

        if (status === "PREMIUM") {
          setSubscription({ status: "PREMIUM", clicksLeft: Infinity });
        } else {
          const now = new Date();
          const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
          const { data: clicks, error: clicksError } = await supabase
            .from("ticker_clicks")
            .select("id")
            .eq("user_id", user.id)
            .eq("month_year", monthYear);

          if (clicksError) throw clicksError;

          const clicksUsed = clicks?.length || 0;
          setSubscription({ status: "FREE", clicksLeft: Math.max(10 - clicksUsed, 0) });
        }
      } catch (error) {
        console.error("Error fetching subscription:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [user]);

  return { subscription, setSubscription, loading };
}

export function useTickerData(user: User | null): TickerData {
  const { subscription, setSubscription, loading: subLoading } = useSubscription(user);
  const [tickerTapeData, setTickerTapeData] = useState<TickerTapeItem[]>([]);
  const [stockLedgerData, setStockLedgerData] = useState<StockLedgerData>({
    stockName: "",
    description: "",
    marketCap: "",
  });
  const [marketCanvasData, setMarketCanvasData] = useState<MarketCanvasData>({
    ticker: "",
    lineData: [],
    barData: [],
  });
  const [postsData, setPostsData] = useState<PostData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [stockLedgerLoading, setStockLedgerLoading] = useState<boolean>(false);
  const [postsLoading, setPostsLoading] = useState<boolean>(false);
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchTickerTapeData = async (): Promise<void> => {
    setLoading(true);
    try {
      const data = await apiFetchTickerTapeData();
      setTickerTapeData(data);
    } catch (error) {
      console.error("Error fetching TickerTape data:", error);
      setErrorMessage("Failed to load ticker tape data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchTickerTapeData();
  }, [user]);

  const handleTickerClick = useCallback(
    async (ticker: string) => {
      if (!user || subLoading) return;

      if (subscription.status === "FREE" && subscription.clicksLeft <= 0) {
        setErrorMessage("Free limit reached (10 tickers/month). Upgrade to PREMIUM for unlimited access.");
        return;
      }

      // Record the click
      const { error: clickError } = await supabase
        .from("ticker_clicks")
        .insert({ user_id: user.id, ticker });

      if (clickError) {
        console.error("Error recording ticker click:", clickError);
        setErrorMessage("Failed to record ticker click.");
        return;
      }

      // Update clicks left for FREE users
      if (subscription.status === "FREE") {
        setSubscription((prev) => ({ ...prev, clicksLeft: prev.clicksLeft - 1 }));
      }

      const debouncedHandleTickerClick = debounce(async (ticker: string): Promise<void> => {
        setStockLedgerLoading(true);
        setPostsLoading(true);
        setErrorMessage(null);
        const cleanTicker = ticker.replace("$", "");
        setSelectedStock(cleanTicker);
        setPostsData([]);
        setMarketCanvasData({ ticker: cleanTicker, lineData: [], barData: [] });
        setStockLedgerData({ stockName: cleanTicker, description: "", marketCap: "" });
        try {
          const [ledgerResponse, canvasResponse, postsResponse] = await Promise.all([
            fetchStockLedgerData(cleanTicker),
            fetchMarketCanvasData(cleanTicker),
            fetchPostsData(cleanTicker),
          ]);

          setStockLedgerData(ledgerResponse);
          if (canvasResponse.lineData.length === 0 || canvasResponse.barData.length === 0) {
            setMarketCanvasData({ ticker: cleanTicker, lineData: [], barData: [] });
            setErrorMessage(`No price/volume data available for ${cleanTicker}.`);
          } else {
            setMarketCanvasData(canvasResponse);
          }
          setPostsData(postsResponse);
        } catch (error) {
          console.error("Error fetching data:", error);
          setStockLedgerData({
            stockName: cleanTicker,
            description: "Failed to fetch ticker info",
            marketCap: "N/A",
          });
          setMarketCanvasData({ ticker: cleanTicker, lineData: [], barData: [] });
          setPostsData([]);
          setErrorMessage(`Unable to load data for ${cleanTicker}. Please try another ticker.`);
        } finally {
          setStockLedgerLoading(false);
          setPostsLoading(false);
        }
      }, 300);
      debouncedHandleTickerClick(ticker);
    },
    [user, subscription, setSubscription, subLoading]
  );

  return {
    tickerTapeData,
    setTickerTapeData,
    stockLedgerData,
    marketCanvasData,
    postsData,
    loading,
    stockLedgerLoading,
    postsLoading,
    selectedStock,
    fetchTickerTapeData,
    handleTickerClick,
    errorMessage,
    subscription,
  };
}