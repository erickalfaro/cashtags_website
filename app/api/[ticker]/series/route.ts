import { NextResponse } from "next/server";
import axios from "axios";

interface AlpacaBar {
  t: string; // Timestamp
  o: number; // Open price
  h: number; // High price
  l: number; // Low price
  c: number; // Close price
  v: number; // Volume
  n: number; // Number of trades
  vw: number; // Volume-weighted average price
}

type ContextParams = {
  params: Promise<{ ticker: string }>;
};

export async function GET(req: Request, ctx: ContextParams) {
  const params = await ctx.params;
  const { ticker } = params;

  console.log(`Fetching Alpaca data for ticker: ${ticker}`);

  const ALPACA_KEY_ID = process.env.ALPACA_KEY_ID;
  const ALPACA_SECRET_KEY = process.env.ALPACA_SECRET_KEY;

  if (!ALPACA_KEY_ID || !ALPACA_SECRET_KEY) {
    return NextResponse.json(
      { error: "Alpaca API credentials are missing" },
      { status: 500 }
    );
  }

  try {
    const url = `https://data.alpaca.markets/v2/stocks/${ticker}/bars`;
    const response = await axios.get<{
      bars: AlpacaBar[] | null;
      symbol: string;
      next_page_token: string | null;
    }>(url, {
      headers: {
        "APCA-API-KEY-ID": ALPACA_KEY_ID,
        "APCA-API-SECRET-KEY": ALPACA_SECRET_KEY,
      },
      params: {
        timeframe: "1Hour",
        limit: 168, // 7 days * 24 hours
        adjustment: "raw",
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString(),
      },
    });

    const bars = response.data.bars || [];
    console.log(`Alpaca response for ${ticker}:`, response.data);

    const lineData = bars.length ? bars.map((bar: AlpacaBar) => bar.c) : [];
    const barData = bars.length ? bars.map((bar: AlpacaBar) => bar.v) : [];

    console.log(`Processed data for ${ticker}:`, { ticker, lineData, barData });

    return NextResponse.json({
      ticker,
      lineData,
      barData,
    });
  } catch (error) {
    console.error("Error fetching Alpaca data:", error);
    // Return empty arrays if the request fails or ticker is invalid
    return NextResponse.json(
      {
        ticker,
        lineData: [],
        barData: [],
      },
      { status: 200 } // Return 200 with empty data
    );
  }
}