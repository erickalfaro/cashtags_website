// lib/api.ts
import axios from "axios";
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