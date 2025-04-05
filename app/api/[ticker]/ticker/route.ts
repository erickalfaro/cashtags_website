// app/api/[ticker]/series/route.ts
import { NextResponse } from "next/server";
import axios from "axios";
import { withAuthAndRateLimit } from "../../../../lib/authRateLimit";

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
          timeframe: "1Min",
          limit: 100,
          adjustment: "raw",
        },
      });

      const bars = response.data.bars || [];
      if (!bars.length) {
        return NextResponse.json({ bars: [] }, { status: 200 });
      }

      const transformedData = bars.map((bar) => ({
        time: bar.t,
        open: bar.o,
        high: bar.h,
        low: bar.l,
        close: bar.c,
        volume: bar.v,
      }));

      return NextResponse.json(transformedData);
    } catch (error) {
      console.error("Error fetching Alpaca data:", error);
      return NextResponse.json({ error: "Failed to fetch series data" }, { status: 500 });
    }
  });
}