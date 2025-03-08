// app/api/summary/route.ts
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { SUMMARY_PROMPT } from "../../../lib/constants"; // Adjust path based on your structure

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error("OPENAI_API_KEY is not set in environment variables.");
  throw new Error("OPENAI_API_KEY environment variable is missing or empty.");
}

const openai = new OpenAI({
  apiKey: apiKey,
});

export async function POST(req: Request) {
  try {
    const { posts, ticker } = await req.json();
    if (!posts || !ticker) {
      return NextResponse.json({ error: "Missing posts or ticker" }, { status: 400 });
    }

    const combinedText = posts.map((post: { text: string }) => post.text).join(" ");
    // Replace {ticker} in the SUMMARY_PROMPT with the actual ticker value
    const promptWithTicker = SUMMARY_PROMPT.replace(/{ticker}/g, ticker);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: promptWithTicker },
        { role: "user", content: combinedText },
      ],
    });

    const summary = completion.choices[0]?.message?.content || "Failed to generate summary.";
    return NextResponse.json({ summary });
  } catch (error) {
    console.error("Error generating summary:", error);
    return NextResponse.json({ error: "Failed to generate summary" }, { status: 500 });
  }
}