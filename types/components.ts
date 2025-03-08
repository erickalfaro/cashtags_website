// types/components.ts
import { TickerTapeItem, StockLedgerData, MarketCanvasData, PostData } from "./api"; // Updated import

export interface TickerTapeProps {
  data: TickerTapeItem[];
  loading: boolean;
  onTickerClick: (ticker: string) => void;
  onSort: (key: keyof TickerTapeItem) => void;
  sortConfig: { key: keyof TickerTapeItem | null; direction: "asc" | "desc" };
}

export interface StockLedgerProps {
  data: StockLedgerData;
  loading: boolean;
}

export interface MarketCanvasProps {
  data: MarketCanvasData;
  selectedStock: string | null;
}

export interface PostViewerProps {
  data: PostData[];
  loading: boolean;
  selectedStock: string | null;
}

export interface GenAISummaryProps {
  postsData: PostData[];
  loading: boolean;
  selectedStock: string | null;
}

export interface RefreshButtonProps {
  onClick: () => void;
}