// lib/api.ts
import axios from "axios";
import { supabase } from "./supabase";
import { StockLedgerData, MarketCanvasData, PostData, TickerTapeItem, TopicItem } from "../types/api";

// Define a type for the raw parsed data
type RawTickerData = {
  id?: number;
  cashtag?: string;
  prev_open?: number | null;
  prev_eod?: number | null;
  latest_price?: number | null;
  chng?: number | null;
  trend?: number[];
} | {
  id?: number;
  topic?: string;
  trend?: number[];
};

export const fetchTickerTapeData = async (): Promise<TickerTapeItem[]> => {
  const response = await axios.get("/api/mockdata");
  return response.data;
};

export const fetchStockLedgerData = async (ticker: string): Promise<StockLedgerData> => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session) throw new Error("User not authenticated");

  const response = await axios.get(`/api/${ticker}/ticker`, { // Assuming this endpoint exists
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  return response.data; // Adjust based on your actual response structure
};

export const fetchMarketCanvasData = async (ticker: string): Promise<MarketCanvasData> => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session) throw new Error("User not authenticated");

  const response = await axios.get(`/api/${ticker}/series`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  return response.data; // Adjust based on your actual response structure
};

export const fetchPostsData = async (ticker: string): Promise<PostData[]> => {
  try {
    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.error("No valid session found:", sessionError?.message || "Session is null");
      throw new Error("User not authenticated");
    }

    const token = session.access_token;
    if (!token) {
      console.error("No access token found in session");
      throw new Error("No access token available");
    }

    console.log(`Fetching posts for ticker: ${ticker} with token: ${token.substring(0, 10)}...`); // Log first 10 chars for debugging

    const response = await axios.get(`/api/${ticker}/posts`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error(`Error fetching posts for ${ticker}:`, error);
    if (axios.isAxiosError(error)) {
      console.error("Axios error details:", {
        status: error.response?.status,
        data: error.response?.data,
      });
    }
    return [];
  }
};

export const fetchTickerTapeDataRealTime = async (tableName: string): Promise<(TickerTapeItem | TopicItem)[]> => {
  const { data, error } = await supabase
    .from(tableName)
    .select("id, data, created_at")
    .order("created_at", { ascending: false });

  if (error) throw error;

  const transformedData = data.flatMap((row) => {
    const parsedData = typeof row.data === "string" ? JSON.parse(row.data) : row.data as RawTickerData[];
    console.log(`Raw data from ${tableName}:`, parsedData); // Debug log
    return parsedData.map((item: RawTickerData, index: number) => { // Explicitly type item
      if (tableName === "frontend_topics") {
        return {
          id: item.id || index + 1,
          topic: (item as { topic?: string }).topic || "Unnamed Topic", // Type assertion for topic
          trend: item.trend || [],
          rowId: row.id,
          key: `${row.id}-${item.id || index}`,
        } as TopicItem;
      }
      return {
        id: item.id || index + 1,
        cashtag: (item as { cashtag?: string }).cashtag || "Unknown", // Type assertion for cashtag
        prev_open: (item as { prev_open?: number | null }).prev_open ?? null,
        prev_eod: (item as { prev_eod?: number | null }).prev_eod ?? null,
        latest_price: (item as { latest_price?: number | null }).latest_price ?? null,
        chng: (item as { chng?: number | null }).chng ?? null,
        trend: item.trend || [],
        rowId: row.id,
        key: `${row.id}-${item.id || index}`,
      } as TickerTapeItem;
    });
  });

  return transformedData;
};

// Add this function
export const fetchTopicPostsData = async (topic: string): Promise<PostData[]> => {
  try {
    const response = await axios.get(`/api/${topic}/topic-posts`); // Still works with 'topic' as the value
    return response.data;
  } catch (error) {
    console.error(`Error fetching topic posts for ${topic}:`, error);
    return [];
  }
};

export const fetchSummary = async (posts: PostData[], identifier: string, isTopic: boolean = false): Promise<string> => {
  return `Sample summary for ${isTopic ? "topic" : "ticker"} ${identifier}`; // Placeholder, update as needed
};