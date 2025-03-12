// types/components.ts
import { TickerTapeItem, StockLedgerData, MarketCanvasData, PostData } from "./api";
import { User } from "@supabase/supabase-js";

export interface TickerTapeProps {
  data: TickerTapeItem[];
  loading: boolean;
  onTickerClick: (ticker: string) => void;
  onSort: (key: keyof TickerTapeItem) => void;
  sortConfig: { key: keyof TickerTapeItem | null; direction: "asc" | "desc" };
  user: User | null;
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
}

export interface RefreshButtonProps {
  onClick: () => void;
}