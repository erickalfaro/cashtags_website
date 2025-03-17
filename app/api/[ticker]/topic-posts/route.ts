// app/api/[ticker]/topic-posts/route.ts
import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";

interface TopicPostData {
  hours: number;
  text: string;
  tweet_id: number;
}

type ContextParams = {
  params: Promise<{ ticker: string }>; // Changed from 'topic' to 'ticker'
};

export async function GET(req: Request, ctx: ContextParams) {
  const params = await ctx.params;
  const { ticker: topic } = params; // Rename 'ticker' to 'topic' internally for clarity

  try {
    const { data, error } = await supabase
      .from("frontend_topics_posts")
      .select("hours, text, tweet_id")
      .eq("topic", topic);

    if (error) {
      console.error("Error fetching topic posts from Supabase:", error);
      return NextResponse.json({ error: "Failed to fetch topic posts" }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    const posts: TopicPostData[] = data.map((item: any) => ({
      hours: item.hours,
      text: item.text,
      tweet_id: item.tweet_id,
    }));

    return NextResponse.json(posts.sort((a, b) => a.hours - b.hours));
  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}