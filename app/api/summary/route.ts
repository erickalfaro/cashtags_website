// app/api/summary/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { SUMMARY_PROMPT } from "../../../lib/constants";
import { withAuthAndRateLimitNoTicker } from "../../../lib/authRateLimit";

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error("OPENAI_API_KEY is not set in environment variables.");
  throw new Error("OPENAI_API_KEY environment variable is missing or empty.");
}

const openai = new OpenAI({ apiKey });

export async function POST(req: NextRequest) {
  return withAuthAndRateLimitNoTicker(req, async (req) => {
    try {
      const { posts, ticker } = await req.json();
      if (!posts || !ticker) {
        return NextResponse.json({ error: "Missing posts or ticker" }, { status: 400 });
      }

      console.log(`Starting summary generation for ticker: ${ticker}, posts count: ${posts.length}`);

      const combinedText = posts.map((post: { text: string }) => post.text).join(" ");
      const promptWithTicker = SUMMARY_PROMPT.replace(/{ticker}/g, ticker);

      const stream = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: promptWithTicker },
          { role: "user", content: combinedText },
        ],
        stream: true,
      });

      console.log(`Stream initiated from OpenAI for ${ticker}`);

      const readableStream = new ReadableStream({
        async start(controller) {
          let chunkCount = 0;
          try {
            for await (const chunk of stream) {
              if (req.signal.aborted) {
                console.log(`Stream aborted by client for ${ticker}`);
                break;
              }
              const content = chunk.choices[0]?.delta?.content || "";
              if (content) {
                chunkCount++;
                console.log(`Sending chunk ${chunkCount} for ${ticker}: "${content}"`);
                controller.enqueue(new TextEncoder().encode(content));
              }
            }
            console.log(`Stream completed for ${ticker}, total chunks: ${chunkCount}`);
          } catch (error) {
            console.error(`Error in stream for ${ticker}:`, error);
            controller.error(error);
          } finally {
            controller.close();
            // Attempt to clean up OpenAI stream (though limited by API)
            stream.controller?.abort?.();
          }
        },
        cancel() {
          console.log(`Stream cancelled by client for ${ticker}`);
          stream.controller?.abort?.(); // Limited effect due to OpenAI API
        },
      });

      return new NextResponse(readableStream, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      });
    } catch (error) {
      console.error("Error generating summary stream:", error);
      return NextResponse.json({ error: "Failed to generate summary" }, { status: 500 });
    }
  });
}

export const config = {
  runtime: "edge",
};