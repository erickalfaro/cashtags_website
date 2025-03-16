// lib/api.ts
import axios from "axios";
import { supabase } from "./supabase";
import { TickerTapeItem, TopicItem, StockLedgerData, MarketCanvasData, PostData } from "../types/api";

export const fetchTickerTapeData = async (): Promise<TickerTapeItem[]> => {
  const response = await axios.get("/api/mockdata");
  return response.data;
};

export const fetchStockLedgerData = async (ticker: string): Promise<StockLedgerData> => {
  const response = await axios.get(`/api/${ticker}/ticker`); // Updated endpoint
  return response.data;
};

export const fetchMarketCanvasData = async (ticker: string): Promise<MarketCanvasData> => {
  const response = await axios.get(`/api/${ticker}/series`); // Updated endpoint
  return response.data;
};

export const fetchPostsData = async (ticker: string): Promise<PostData[]> => {
  const response = await axios.get(`/api/${ticker}/posts`); // Updated endpoint
  return response.data;
};

export const fetchTickerTapeDataRealTime = async (tableName: string): Promise<(TickerTapeItem | TopicItem)[]> => {
  const { data, error } = await supabase
    .from(tableName)
    .select("id, data, created_at")
    .order("created_at", { ascending: false });

  if (error) throw error;

  const transformedData = data.flatMap((row) => {
    const parsedData = typeof row.data === "string" ? JSON.parse(row.data) : row.data;
    console.log(`Raw data from ${tableName}:`, parsedData); // Debug log
    return (parsedData as any[]).map((item, index) => {
      if (tableName === "frontend_topics") {
        return {
          id: item.id || index + 1,
          topic: item.cashtag || item.name || item.title || "Unnamed Topic", // Try common field names
          trend: item.trend || [],
          rowId: row.id,
          key: `${row.id}-${item.id || index}`,
        } as TopicItem;
      }
      return {
        id: item.id,
        cashtag: item.cashtag,
        prev_open: item.prev_open,
        prev_eod: item.prev_eod,
        latest_price: item.latest_price,
        chng: item.chng,
        trend: item.trend,
        rowId: row.id,
        key: `${row.id}-${item.id || index}`,
      } as TickerTapeItem;
    });
  });

  return transformedData;
};