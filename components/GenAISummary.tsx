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
  const fetchPromiseRef = useRef<Promise<void> | null>(null);
  const isStreamingRef = useRef(false);

  const abortCurrentStream = useCallback(async () => {
    if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
      console.log(`Aborting current stream for ${selectedStock}`);
      abortControllerRef.current.abort();

      if (readerRef.current) {
        // Only cancel reader if stream is still active
        try {
          await readerRef.current.cancel();
        } catch (err) {
          if (err instanceof DOMException && err.name === "AbortError") {
            console.log(`Reader already aborted for ${selectedStock}, ignoring error`);
          } else {
            console.error("Error cancelling reader:", err);
          }
        }
        readerRef.current = null;
      }

      if (fetchPromiseRef.current) {
        await fetchPromiseRef.current.catch(() => {}); // Wait for fetch to settle
      }

      isStreamingRef.current = false;
      abortControllerRef.current = null;
      fetchPromiseRef.current = null;
      console.log(`Stream fully aborted for ${selectedStock}`);
    }
  }, [selectedStock]);

  const startNewStream = useCallback(async (ticker: string, currentPageMode: "cashtags" | "topics") => {
    if (!ticker || !postsData.length) return;

    // Ensure any existing stream is fully aborted first
    await abortCurrentStream();

    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    const signal = abortController.signal;

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      console.error("Failed to get session:", sessionError?.message || "No session available");
      setSummary("Please log in to view the summary.");
      return;
    }

    const token = session.access_token;
    if (!token) {
      console.error("No access token found in session");
      setSummary("Authentication error: No access token available.");
      return;
    }

    isStreamingRef.current = true;
    setSummary("");
    console.log(`Starting new stream for ${ticker} in ${currentPageMode} mode`);

    const fetchPromise = (async () => {
      try {
        const response = await fetch("/api/summary", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({
            posts: postsData,
            ticker: ticker,
            isTopic: currentPageMode === "topics",
          }),
          signal,
        });

        if (!response.ok || !response.body) {
          throw new Error(`HTTP error: ${response.status}`);
        }

        const reader = response.body.getReader();
        readerRef.current = reader;
        const decoder = new TextDecoder("utf-8");
        let chunkCount = 0;

        while (true) {
          if (signal.aborted) {
            console.log(`Stream aborted for ${ticker} before reading next chunk`);
            break;
          }

          const { done, value } = await reader.read();
          if (done) {
            console.log(`Stream completed for ${ticker}, total chunks: ${chunkCount}`);
            break;
          }

          if (signal.aborted) {
            console.log(`Stream aborted for ${ticker} during read`);
            break;
          }

          chunkCount++;
          const chunk = decoder.decode(value, { stream: true });
          console.log(`Received chunk ${chunkCount} for ${ticker}: "${chunk}"`);
          setSummary((prev) => prev + chunk);
        }
      } catch (error) {
        if (!signal.aborted) {
          console.error("Error streaming summary:", error);
          setSummary("Failed to generate summary due to an error.");
        } else {
          console.log(`Stream for ${ticker} was intentionally aborted`);
        }
      } finally {
        isStreamingRef.current = false;
        readerRef.current = null;
        if (!signal.aborted) {
          abortControllerRef.current = null;
        }
      }
    })();

    fetchPromiseRef.current = fetchPromise;
    await fetchPromise; // Ensure the fetch completes or aborts
  }, [postsData, abortCurrentStream]);

  const handleTickerChange = useCallback(async (newTicker: string) => {
    if (newTicker === selectedStock && isStreamingRef.current) {
      console.log(`Stream already active for ${newTicker}, skipping`);
      return;
    }
    await startNewStream(newTicker, pageMode);
  }, [selectedStock, pageMode, startNewStream]);

  // Trigger stream when selectedStock changes
  useEffect(() => {
    if (selectedStock && postsData.length) {
      handleTickerChange(selectedStock);
    }
    return () => {
      // Minimal cleanup to reset state, full abort handled in startNewStream
      isStreamingRef.current = false;
    };
  }, [selectedStock, postsData, handleTickerChange]);

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
          <ReactMarkdown remarkPlugins={[remarkBreaks]}>{summary}</ReactMarkdown>
        ) : (
          <div className="animated-placeholder flex items-center justify-center h-full">
            <span>
              {pageMode === "cashtags" ? "Click a Cashtag" : "Click a Topic"} to see the summary
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default GenAISummary;