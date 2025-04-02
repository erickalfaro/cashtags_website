"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
// Import the proper type instead of using "any"
import { PostData } from "@/types/api";

interface GenAISummaryProps {
  postsData: PostData[]; // Now using PostData type
  loading: boolean;
  selectedStock: string | null;
  pageMode: "cashtags" | "topics";
}

const GenAISummary: React.FC<GenAISummaryProps> = ({ postsData, loading, selectedStock, pageMode }) => {
  const [summary, setSummary] = useState("");
  const abortControllerRef = useRef<AbortController | null>(null);
  const latestStockRef = useRef<string | null>(null);
  const accumulatedRef = useRef("");
  const isStreamingRef = useRef(false);

  const fetchSummaryStream = useCallback(async () => {
    if (!selectedStock) return;

    // Abort any previous stream
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setSummary("");
    accumulatedRef.current = "";

    latestStockRef.current = selectedStock;
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    const signal = abortController.signal;

    isStreamingRef.current = true;
    try {
      // Capture pageMode for the API payload
      const response = await fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          posts: postsData,
          ticker: selectedStock,
          isTopic: pageMode === "topics",
        }),
        signal,
      });
      if (!response.ok || !response.body) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let chunkCount = 0;
      while (true) {
        if (signal.aborted) break;
        const { done, value } = await reader.read();
        if (done) break;
        chunkCount++;
        const chunk = decoder.decode(value, { stream: true });
        accumulatedRef.current += chunk;
        // Append each new chunk to the summary
        setSummary((prev) => prev + chunk);
      }
      console.log(`Stream completed for ${selectedStock}, total chunks: ${chunkCount}`);
    } catch (error) {
      if (!signal.aborted) {
        console.error("Error streaming summary:", error);
        setSummary("Failed to generate summary due to an error.");
      }
    } finally {
      isStreamingRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStock, postsData]); // Intentionally omitting pageMode

  useEffect(() => {
    fetchSummaryStream();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      isStreamingRef.current = false;
    };
  }, [fetchSummaryStream, selectedStock]); // Intentionally omitting pageMode

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
