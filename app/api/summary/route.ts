// app/api/summary/route.ts
import { NextRequest } from "next/server";
import OpenAI from "openai";
import { SUMMARY_PROMPT } from "../../../lib/constants";

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error("OPENAI_API_KEY is not set in environment variables.");
  throw new Error("OPENAI_API_KEY environment variable is missing or empty.");
}

const openai = new OpenAI({
  apiKey: apiKey,
});

export async function POST(req: NextRequest) {
  try {
    const { posts, ticker } = await req.json();
    if (!posts || !ticker) {
      return new Response(JSON.stringify({ error: "Missing posts or ticker" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
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
      stream: true, // Enable streaming
    });

    console.log("Stream initiated from OpenAI");

    const readableStream = new ReadableStream({
      async start(controller) {
        let chunkCount = 0;
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || "";
          if (content) {
            chunkCount++;
            console.log(`Streaming chunk ${chunkCount}:`, content);
            controller.enqueue(new TextEncoder().encode(content));
          }
        }
        console.log(`Streaming complete, total chunks: ${chunkCount}`);
        controller.close();
      },
      cancel() {
        console.log("Stream cancelled by client");
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error generating summary stream:", error);
    return new Response(JSON.stringify({ error: "Failed to generate summary" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export const config = {
  runtime: "edge", // Optional: Use Edge runtime for faster streaming if supported by your deployment
};