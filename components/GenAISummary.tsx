// components/GenAISummary.tsx
"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import { PostData } from "@/types/api";
import { supabase } from "@/lib/supabase";

interface GenAISummaryProps {
  postsData: PostData[];
  loading: boolean;
  selectedStock: string | null;
  pageMode: "cashtags" | "topics";
}

const GenAISummary: React.FC<GenAISummaryProps> = ({ postsData, loading, selectedStock, pageMode }) => {
  const [summary, setSummary] = useState("");
  const abortControllerRef = useRef<AbortController | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader | null>(null);
  const isStreamingRef = useRef(false);
  const activeTickerRef = useRef<string | null>(null);

  const SummaryDisplay = React.memo(({ content }: { content: string }) => (
    <ReactMarkdown remarkPlugins={[remarkBreaks]}>{content}</ReactMarkdown>
  ));
  SummaryDisplay.displayName = "SummaryDisplay";

  const abortCurrentStream = useCallback(async () => {
    if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
      console.log(`Aborting stream for ${activeTickerRef.current}`);
      abortControllerRef.current.abort();

      if (readerRef.current) {
        try {
          await readerRef.current.cancel();
        } catch (err) {
          if (err instanceof DOMException && err.name === "AbortError") {
            console.log(`Reader already aborted for ${activeTickerRef.current}`);
          } else {
            console.error("Error cancelling reader:", err);
          }
        }
        readerRef.current = null;
      }

      isStreamingRef.current = false;
      abortControllerRef.current = null;
      activeTickerRef.current = null;
    }
  }, []);

  const startStream = useCallback(
    async (ticker: string, posts: PostData[], mode: "cashtags" | "topics") => {
      if (!ticker || !posts.length) {
        console.log("No ticker or posts, skipping stream");
        setSummary("");
        return;
      }

      // Only abort if the ticker changes
      if (activeTickerRef.current && activeTickerRef.current !== ticker) {
        await abortCurrentStream();
      }

      // If already streaming for this ticker, skip starting a new stream
      if (isStreamingRef.current && activeTickerRef.current === ticker) {
        console.log(`Stream already in progress for ${ticker}, skipping`);
        return;
      }

      console.log(`Starting stream for ${ticker} in ${mode} mode`);
      const abortController = new AbortController();
      abortControllerRef.current = abortController;
      const signal = abortController.signal;

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        console.error("Session error:", sessionError?.message);
        setSummary("Please log in to view the summary.");
        return;
      }

      const token = session.access_token;
      if (!token) {
        console.error("No access token");
        setSummary("Authentication error: No access token.");
        return;
      }

      isStreamingRef.current = true;
      activeTickerRef.current = ticker;
      setSummary(""); // Reset summary only for a new ticker

      try {
        const response = await fetch("/api/summary", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            posts: posts,
            ticker: ticker,
            isTopic: mode === "topics",
          }),
          signal,
        });

        if (!response.ok || !response.body) {
          throw new Error(`HTTP error: ${response.status}`);
        }

        const reader = response.body.getReader();
        readerRef.current = reader;
        const decoder = new TextDecoder("utf-8");

        while (true) {
          if (signal.aborted) {
            console.log(`Stream aborted for ${ticker}`);
            break;
          }

          const { done, value } = await reader.read();
          if (done) {
            console.log(`Stream completed for ${ticker}`);
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          setSummary((prev) => prev + chunk);
        }
      } catch (error) {
        if (!signal.aborted) {
          console.error("Streaming error:", error);
          setSummary("Failed to generate summary.");
        }
      } finally {
        isStreamingRef.current = false;
        readerRef.current = null;
        if (!signal.aborted) {
          abortControllerRef.current = null;
          activeTickerRef.current = null;
        }
      }
    },
    [abortCurrentStream]
  );

  useEffect(() => {
    if (selectedStock && postsData.length > 0 && !loading) {
      console.log(`Triggering stream for ${selectedStock} with ${postsData.length} posts`);
      startStream(selectedStock, postsData, pageMode);
    } else if (!selectedStock || loading) {
      console.log("Clearing summary due to no selectedStock or loading state");
      setSummary("");
      abortCurrentStream();
    }

    return () => {
      // Only abort on unmount, not on every effect run
      // abortCurrentStream();
    };
  }, [selectedStock, postsData, loading, startStream]); // Removed pageMode from dependencies

  return (
    <div className="GenAISummary container">
      <div className="container-header">
        {selectedStock ? (
          <>
            ${selectedStock} - <span style={{ color: "rgba(0,230,118,1)" }}>AI</span> Summary
          </>
        ) : (
          <>
            <span style={{ color: "rgba(0,230,118,1)" }}>AI</span> Summary
          </>
        )}
        {loading && " (Loading...)"}
      </div>
      <div className="container-content" style={{ padding: "1rem", minHeight: "200px" }}>
        {summary ? (
          <SummaryDisplay content={summary} />
        ) : (
          <div className="animated-placeholder flex items-center justify-center h-full">
            <span>{pageMode === "cashtags" ? "Click a Cashtag" : "Click a Topic"} to see the summary</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default GenAISummary;