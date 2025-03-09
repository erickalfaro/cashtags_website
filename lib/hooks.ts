// lib/hooks.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { supabase } from "./supabase";
import { debounce, getEnvironment } from "./utils";
import {
  fetchTickerTapeData as apiFetchTickerTapeData,
  fetchStockLedgerData,
  fetchMarketCanvasData,
  fetchPostsData,
} from "./api";
import { TickerTapeItem, StockLedgerData, MarketCanvasData, PostData } from "../types/api";

interface SupabaseError {
  code: string;
  message: string;
  details?: string | null;
  hint?: string | null;
}

interface SubscriptionStatus {
  status: "FREE" | "PREMIUM";
  clicksLeft: number;
}

interface SubscriptionData {
  subscription: SubscriptionStatus;
  setSubscription: React.Dispatch<React.SetStateAction<SubscriptionStatus>>;
  loading: boolean;
  fetchSubscription: () => Promise<void>;
}

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
  fetchSubscription: () => Promise<void>;
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
      console.log("Fetching user session...");
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error("Error getting session:", sessionError);
        return;
      }

      const loggedInUser = data.session?.user ?? null;
      setUser(loggedInUser);

      if (loggedInUser) {
        const environment = getEnvironment();
        const tableName = environment === "dev" ? "user_subscriptions_preview" : "user_subscriptions_prod";
        console.log("User logged in:", loggedInUser.id, "Using table:", tableName);

        let existingSub = null;
        try {
          const { data: subData, error: checkError } = await supabase
            .from(tableName)
            .select("user_id")
            .eq("user_id", loggedInUser.id)
            .single();

          if (checkError && checkError.code !== "PGRST116") {
            console.error("Unexpected error checking subscription:", checkError);
            return;
          }
          existingSub = subData;
        } catch (err: unknown) {
          const supabaseErr = err as SupabaseError;
          if (supabaseErr.code === "PGRST116") {
            console.log("No subscription found for user:", loggedInUser.id);
          } else {
            console.error("Error querying subscription:", supabaseErr);
            return;
          }
        }

        if (!existingSub) {
          console.log("Inserting new subscription for user:", loggedInUser.id);
          const { error: insertError } = await supabase
            .from(tableName)
            .insert({
              user_id: loggedInUser.id,
              subscription_status: "FREE",
              ticker_click_count: 0, // Initialize with 0 clicks
            });

          if (insertError) {
            console.error("Error inserting user subscription:", insertError);
          } else {
            console.log("Successfully inserted subscription for user:", loggedInUser.id);
          }
        } else {
          console.log("Subscription already exists for user:", loggedInUser.id);
        }
      } else {
        console.log("No user logged in.");
      }
    };
    fetchUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event);
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
      window.location.href = `${baseUrl}/`;
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

  const fetchSubscription = useCallback(async () => {
    if (!user) {
      setSubscription({ status: "FREE", clicksLeft: 10 });
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const environment = getEnvironment();
      const tableName = environment === "dev" ? "user_subscriptions_preview" : "user_subscriptions_prod";
      console.log("Fetching subscription from:", tableName);

      const { data, error } = await supabase
        .from(tableName)
        .select("subscription_status, ticker_click_count")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      const status = data?.subscription_status || "FREE";
      const clickCount = data?.ticker_click_count || 0;
      console.log("Subscription status fetched:", { status, clickCount });

      if (status === "PREMIUM") {
        setSubscription({ status: "PREMIUM", clicksLeft: Infinity });
      } else {
        setSubscription({ status: "FREE", clicksLeft: Math.max(10 - clickCount, 0) });
      }
    } catch (error) {
      console.error("Error fetching subscription:", error);
      setSubscription({ status: "FREE", clicksLeft: 10 });
    } finally {
      setLoading(false);
    }
  }, [user]); // Dependencies: user (setSubscription and setLoading are stable)

  useEffect(() => {
    fetchSubscription();

    if (!user) return;

    const environment = getEnvironment();
    const tableName = environment === "dev" ? "user_subscriptions_preview" : "user_subscriptions_prod";
    const channel = supabase
      .channel("subscription-changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: tableName,
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("Real-time subscription update:", payload);
          fetchSubscription();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchSubscription]); // fetchSubscription is now stable

  return { subscription, setSubscription, loading, fetchSubscription };
}

export function useTickerData(user: User | null): TickerData {
  const { subscription, setSubscription, loading: subLoading, fetchSubscription } = useSubscription(user);
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
        setErrorMessage("Free limit reached (10 tickers). Upgrade to PREMIUM for unlimited access.");
        return;
      }

      const environment = getEnvironment();
      const tableName = environment === "dev" ? "user_subscriptions_preview" : "user_subscriptions_prod";

      // Increment ticker_click_count
      const { data, error: clickError } = await supabase
        .from(tableName)
        .select("ticker_click_count")
        .eq("user_id", user.id)
        .single();

      if (clickError && clickError.code !== "PGRST116") {
        console.error("Error fetching ticker click count:", clickError);
        setErrorMessage("Failed to record ticker click.");
        return;
      }

      const currentCount = data?.ticker_click_count || 0;
      const { error: updateError } = await supabase
        .from(tableName)
        .update({ ticker_click_count: currentCount + 1, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);

      if (updateError) {
        console.error("Error updating ticker click count:", updateError);
        setErrorMessage("Failed to record ticker click.");
        return;
      }

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
    fetchSubscription,
  };
}