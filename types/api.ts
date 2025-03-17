// types/api.ts
export interface AlpacaBar {
  t: string;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
  n: number;
  vw: number;
}
// types/api.ts
export interface TickerTapeItem {
  id: number;
  cashtag: string;
  prev_open: number | null;
  prev_eod: number | null;
  latest_price: number | null;
  chng: number | null;
  trend: number[];
  rowId?: number;
  key?: string;
}

export interface TopicItem {
  id: number;
  topic: string;
  trend: number[]; // Assuming this represents mentions over time
  rowId?: number;
  key?: string;
}

export interface StockLedgerData {
  stockName: string;
  description: string;
  marketCap: string;
}

export interface MarketCanvasData {
  ticker: string;
  lineData: number[];
  barData: number[];
}

export interface PostData {
  hours: number;
  text: string;
  tweet_id: number;
}