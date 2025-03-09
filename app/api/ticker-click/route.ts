// app/api/ticker-click/route.ts
import { supabase } from "../../../lib/supabase";
import { NextResponse } from "next/server";
import { getEnvironment } from "../../../lib/utils";

export async function POST(req: Request) {
  const user = await supabase.auth.getUser();
  if (!user.data.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const environment = getEnvironment();
  const tableName = environment === "dev" ? "user_subscriptions_preview" : "user_subscriptions_prod";
  const FREE_TIER_LIMIT = 10;

  const { data: subData, error: fetchError } = await supabase
    .from(tableName)
    .select("subscription_status, ticker_click_count")
    .eq("user_id", user.data.user.id)
    .single();

  if (fetchError && fetchError.code !== "PGRST116") {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  if (!subData) {
    const { error: insertError } = await supabase
      .from(tableName)
      .insert({ user_id: user.data.user.id, subscription_status: "FREE", ticker_click_count: 1 });

    if (insertError) return NextResponse.json({ error: "Failed to initialize user" }, { status: 500 });
    return NextResponse.json({ success: true, remainingClicks: FREE_TIER_LIMIT - 1 });
  }

  const { subscription_status, ticker_click_count } = subData;

  if (subscription_status === "FREE" && ticker_click_count >= FREE_TIER_LIMIT) {
    return NextResponse.json({
      error: "Click limit reached",
      message: "Upgrade to PREMIUM for unlimited clicks",
    }, { status: 403 });
  }

  const { error: updateError } = await supabase
    .from(tableName)
    .update({ ticker_click_count: ticker_click_count + 1, updated_at: new Date().toISOString() })
    .eq("user_id", user.data.user.id);

  if (updateError) return NextResponse.json({ error: "Failed to record click" }, { status: 500 });

  const remainingClicks = subscription_status === "FREE" ? FREE_TIER_LIMIT - (ticker_click_count + 1) : "unlimited";
  return NextResponse.json({ success: true, remainingClicks });
}