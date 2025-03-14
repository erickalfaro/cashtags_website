// lib/hooks.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { supabase } from "./supabase";
import { getEnvironment } from "./utils";
import { fetchTickerTapeDataRealTime } from "./api";
import { fetchStockLedgerData, fetchMarketCanvasData, fetchPostsData } from "./api";
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
  currentPeriodEnd?: Date | null;
  cancelAt?: Date | null;
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
  setStockLedgerData: React.Dispatch<React.SetStateAction<StockLedgerData>>;
  marketCanvasData: MarketCanvasData;
  setMarketCanvasData: React.Dispatch<React.SetStateAction<MarketCanvasData>>;
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
    currentPeriodEnd: null,
    cancelAt: null,
  });
  const [loading, setLoading] = useState<boolean>(true);

  const fetchSubscription = useCallback(async () => {
    if (!user) {
      setSubscription({ status: "FREE", clicksLeft: 10, currentPeriodEnd: null, cancelAt: null });
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const environment = getEnvironment();
      const tableName = environment === "dev" ? "user_subscriptions_preview" : "user_subscriptions_prod";

      const { data, error } = await supabase
        .from(tableName)
        .select("subscription_status, ticker_click_count, current_period_end, cancel_at")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      const status = data?.subscription_status || "FREE";
      const clickCount = data?.ticker_click_count || 0;
      const currentPeriodEnd = data?.current_period_end ? new Date(data.current_period_end) : null;
      const cancelAt = data?.cancel_at ? new Date(data.cancel_at) : null;

      // Check if cancellation date has passed
      if (status === "PREMIUM" && cancelAt && cancelAt <= new Date()) {
        setSubscription({
          status: "FREE",
          clicksLeft: Math.max(10 - clickCount, 0),
          currentPeriodEnd: null,
          cancelAt: null,
        });
      } else if (status === "PREMIUM") {
        setSubscription({
          status: "PREMIUM",
          clicksLeft: Infinity,
          currentPeriodEnd,
          cancelAt,
        });
      } else {
        setSubscription({
          status: "FREE",
          clicksLeft: Math.max(10 - clickCount, 0),
          currentPeriodEnd: null,
          cancelAt: null,
        });
      }
    } catch (error) {
      console.error("Error fetching subscription:", error);
      setSubscription({ status: "FREE", clicksLeft: 10, currentPeriodEnd: null, cancelAt: null });
    } finally {
      setLoading(false);
    }
  }, [user]);

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
        () => fetchSubscription()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchSubscription]);

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
      const data = await fetchTickerTapeDataRealTime();
      setTickerTapeData(data);
    } catch (error) {
      console.error("Error fetching TickerTape data:", error);
      setErrorMessage("Failed to load ticker tape data.");
    } finally {
      setLoading(false);
    }
  };

  const handleTickerClick = async (ticker: string) => {
    if (!user) return; // Do nothing if user isn’t logged in

    // Check click limits for FREE tier
    if (subscription.status === "FREE" && subscription.clicksLeft <= 0) {
      setErrorMessage("No clicks left. Subscribe to PREMIUM for unlimited access.");
      return;
    }

    // Set the selected stock and start loading
    setSelectedStock(ticker);
    setStockLedgerLoading(true);
    setPostsLoading(true);
    setErrorMessage(null);

    try {
      // Fetch data for the clicked ticker
      const [ledger, canvas, posts] = await Promise.all([
        fetchStockLedgerData(ticker),
        fetchMarketCanvasData(ticker),
        fetchPostsData(ticker),
      ]);

      // Update state with the fetched data
      setStockLedgerData(ledger);
      setMarketCanvasData(canvas);
      setPostsData(posts);

      // Update click count for FREE tier users
      if (subscription.status === "FREE") {
        const environment = getEnvironment();
        const tableName = environment === "dev" ? "user_subscriptions_preview" : "user_subscriptions_prod";
        const newClickCount = Math.min((subscription.clicksLeft - 1) * -1 + 10, 10); // Increment click count
        const { error } = await supabase
          .from(tableName)
          .update({ ticker_click_count: newClickCount })
          .eq("user_id", user.id);

        if (error) throw error;

        setSubscription((prev) => ({
          ...prev,
          clicksLeft: Math.max(10 - newClickCount, 0),
        }));
      }

      console.log(`Ticker clicked: ${ticker}, data fetched successfully`);
    } catch (error) {
      console.error(`Error fetching data for ticker ${ticker}:`, error);
      setErrorMessage(`Failed to load data for $${ticker}.`);
    } finally {
      setStockLedgerLoading(false);
      setPostsLoading(false);
    }
  };

  useEffect(() => {
    if (!user || subLoading) return;

    // Initial fetch
    fetchTickerTapeData();

    if (subscription.status === "PREMIUM") {
      // Real-time subscription for PREMIUM users
      try {
        const channel = supabase
          .channel("ticker-tape-changes")
          .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "frontend_timeseries_data" },
            () => fetchTickerTapeData()
          )
          .on(
            "postgres_changes",
            { event: "UPDATE", schema: "public", table: "frontend_timeseries_data" },
            () => fetchTickerTapeData()
          )
          .subscribe((status) => {
            if (status === "SUBSCRIBED") {
              console.log("Real-time subscription active for PREMIUM user");
            } else if (status === "CHANNEL_ERROR") {
              console.error("Subscription error");
            }
          });
        return () => {
          supabase.removeChannel(channel);
        };
      } catch (error) {
        console.error("Error setting up real-time subscription:", error);
      }
    } else {
      // Scheduled refresh for FREE users (12, 32, 47 minutes)
      const scheduleRefresh = () => {
        const now = new Date();
        const minutes = now.getMinutes();
        const seconds = now.getSeconds();
        const msPastMinute = seconds * 1000;

        const targetMinutes = [12, 32, 47];
        let nextRefreshMinute = targetMinutes.find((m) => m > minutes) || targetMinutes[0];
        if (nextRefreshMinute <= minutes) {
          nextRefreshMinute += 60;
        }

        const msUntilNextRefresh = (nextRefreshMinute - minutes) * 60 * 1000 - msPastMinute;
        console.log(`Next refresh for FREE user in ${msUntilNextRefresh / 1000} seconds`);

        const timeout = setTimeout(() => {
          fetchTickerTapeData();
          setInterval(() => {
            const now = new Date().getMinutes();
            if (targetMinutes.includes(now)) {
              fetchTickerTapeData();
            }
          }, 60 * 1000);
        }, msUntilNextRefresh);

        return () => clearTimeout(timeout);
      };

      scheduleRefresh();
    }
  }, [user, subLoading, subscription.status]);

  return {
    tickerTapeData,
    setTickerTapeData,
    stockLedgerData,
    setStockLedgerData,
    marketCanvasData,
    setMarketCanvasData,
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