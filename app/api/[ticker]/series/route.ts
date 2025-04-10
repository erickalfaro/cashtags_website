// app/api/[ticker]/series/route.ts
import { NextResponse } from "next/server";
import axios from "axios";
import { withAuthAndRateLimit } from "../../../../lib/authRateLimit";

interface AlpacaBar {
  t: string;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
  n: number;
  vw: number;
}

type ContextParams = {
  params: Promise<{ ticker: string }>;
};

export async function GET(req: Request, ctx: ContextParams) {
  return withAuthAndRateLimit(req, ctx, async (req, ticker) => {
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

      const transformedData = {
        ticker,
        lineData: bars.map((bar) => bar.c),
        barData: bars.map((bar) => bar.v),
        timestamps: bars.map((bar) => bar.t),
      };

      console.log(`Processed data for ${ticker}:`, transformedData);
      return NextResponse.json(transformedData);
    } catch (error) {
      console.error("Error fetching Alpaca data:", error);
      return NextResponse.json(
        {
          ticker,
          lineData: [],
          barData: [],
          timestamps: [], // Include timestamps in error case
        },
        { status: 200 }
      );
    }
  });
}