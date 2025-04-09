// app/api/[ticker]/news/route.ts
import { NextResponse } from "next/server";
import axios from "axios";
import { withAuthAndRateLimit } from "../../../../lib/authRateLimit";

type TickerContext = {
  params: Promise<{ ticker: string }>;
};

export async function GET(req: Request, ctx: TickerContext) {
  return withAuthAndRateLimit(req, ctx, async (req, ticker) => {
    const tickerValue = ticker!; // Non-null assertion, guaranteed by dynamic route

    const POLYGON_API_KEY = process.env.POLYGON_API_KEY;

    if (!POLYGON_API_KEY) {
      console.error("Polygon API key is missing");
      return NextResponse.json(
        { error: "Server configuration error: Polygon API key missing" },
        { status: 500 }
      );
    }

    try {
      const url = `https://api.polygon.io/v2/reference/news`;
      const response = await axios.get(url, {
        params: {
          ticker: tickerValue.toUpperCase(),
          order: "desc",
          limit: 10,
          sort: "published_utc",
          apiKey: POLYGON_API_KEY,
        },
      });

      const newsItems = response.data.results.map((item: any) => ({
        hours: calculateHoursAgo(item.published_utc),
        text: `${item.title} - ${item.publisher.name} (${item.description || "No description"})`,
        article_url: item.article_url,
      }));

      return NextResponse.json(newsItems);
    } catch (error) {
      console.error("Error fetching Polygon.io news:", error);
      return NextResponse.json(
        { error: `Failed to fetch news for ${tickerValue}` },
        { status: 500 }
      );
    }
  });
}

function calculateHoursAgo(publishedUtc: string): number {
  const publishedDate = new Date(publishedUtc);
  const now = new Date();
  const diffMs = now.getTime() - publishedDate.getTime();
  return Math.round(diffMs / (1000 * 60 * 60)); // Convert to hours
}