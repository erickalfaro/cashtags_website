// types/components.ts
import { TickerTapeItem, TopicItem, StockLedgerData, MarketCanvasData, PostData } from "./api";
import { User } from "@supabase/supabase-js";

export interface TickerTapeProps {
  data: (TickerTapeItem | TopicItem)[];
  loading: boolean;
  onTickerClick: (ticker: string) => void;
  onSort: (key: keyof TickerTapeItem | keyof TopicItem) => void;
  sortConfig: { key: keyof TickerTapeItem | keyof TopicItem | null; direction: "asc" | "desc" };
  user: User | null;
  pageMode: "cashtags" | "topics"; // Add pageMode to props
}

export interface StockOverviewProps {
  data: {
    marketCanvas: MarketCanvasData;
    stockLedger: StockLedgerData;
  };
  selectedStock: string | null;
  loading: boolean;
}

export interface PostViewerProps {
  data: PostData[];
  loading: boolean;
  selectedStock: string | null;
  user: User | null;
}

export interface GenAISummaryProps {
  postsData: PostData[];
  loading: boolean;
  selectedStock: string | null;
  pageMode: "cashtags" | "topics";
}