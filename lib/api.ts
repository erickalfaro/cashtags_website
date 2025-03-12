// lib/api.ts
import axios from "axios";
import { supabase } from "./supabase";
import { StockLedgerData, MarketCanvasData, PostData, TickerTapeItem } from "../types/api";

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

export const fetchTickerTapeDataRealTime = async (): Promise<TickerTapeItem[]> => {
  const { data, error } = await supabase
    .from("frontend_timeseries_data")
    .select("id, data, created_at")
    .order("created_at", { ascending: false });

  if (error) throw error;

  const transformedData = data.flatMap((row) => {
    const parsedData = typeof row.data === "string" ? JSON.parse(row.data) : row.data;
    return (parsedData as TickerTapeItem[]).map((item, index) => ({
      ...item,
      rowId: row.id, // Preserve the table’s row id for uniqueness
      key: `${row.id}-${item.id || index}`, // Composite key
    }));
  });

  return transformedData;
};