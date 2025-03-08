import { NextResponse } from "next/server";
import axios from "axios";
import { withValidation, handleApiError } from "../../../../lib/baseRoute";

type TickerContext = {
  params: Promise<{ ticker: string }>;
};

const handler = async (req: Request, ctx: TickerContext) => {
  const params = await ctx.params;
  const { ticker } = params;

  const POLYGON_API_KEY = process.env.POLYGON_API_KEY;

  if (!POLYGON_API_KEY) {
    return handleApiError(null, "Polygon API key is missing");
  }

  try {
    const url = `https://api.polygon.io/v3/reference/tickers/${ticker}`;
    const response = await axios.get(url, {
      params: {
        apiKey: POLYGON_API_KEY,
      },
    });

    const data = response.data.results;

    const tickerData = {
      stockName: data.name || "Unknown",
      description: data.description || "No description available",
      marketCap: data.market_cap ? formatMarketCap(data.market_cap) : "N/A",
    };

    return NextResponse.json(tickerData);
  } catch (error) {
    console.error("Error fetching Polygon.io data:", error);
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return NextResponse.json(
        {
          stockName: ticker,
          description: "Ticker not found in Polygon.io database",
          marketCap: "N/A",
        },
        { status: 200 }
      );
    }
    return handleApiError(error, `Failed to fetch data for ${ticker}`);
  }
};

export const GET = withValidation(handler);

function formatMarketCap(marketCap: number): string {
  if (marketCap >= 1e11) return `${(marketCap / 1e9).toFixed(0)}B`;
  if (marketCap >= 1e9) return `${(marketCap / 1e9).toFixed(1)}B`;
  return `${(marketCap / 1e6).toFixed(0)}M`;
}