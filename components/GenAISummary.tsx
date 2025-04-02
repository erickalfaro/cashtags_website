"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";

interface GenAISummaryProps {
  postsData: any[]; // adjust types as needed
  loading: boolean;
  selectedStock: string | null;
  pageMode: "cashtags" | "topics";
}

const GenAISummary: React.FC<GenAISummaryProps> = ({ postsData, loading, selectedStock, pageMode }) => {
  const [summary, setSummary] = useState("");
  const abortControllerRef = useRef<AbortController | null>(null);
  const latestStockRef = useRef<string | null>(null);
  const isStreamingRef = useRef(false);

  // Only re-run the stream when selectedStock (or postsData) changes.
  // We deliberately leave pageMode out so that switching tabs doesn't re-fetch the summary.
  const fetchSummaryStream = useCallback(async () => {
    if (!selectedStock) return;

    // Abort any previous stream
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setSummary("");

    // Save the currently selected ticker
    latestStockRef.current = selectedStock;
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    const signal = abortController.signal;

    isStreamingRef.current = true;
    try {
      // Capture the current mode as a constant so the request payload is correct
      const isTopic = pageMode === "topics";
      const response = await fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          posts: postsData,
          ticker: selectedStock,
          isTopic, // using captured value
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
        // Append each chunk to the current summary
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
  }, [selectedStock, postsData]); // pageMode removed from dependencies

  useEffect(() => {
    fetchSummaryStream();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      isStreamingRef.current = false;
    };
  }, [fetchSummaryStream, selectedStock]); // pageMode removed here, too

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
