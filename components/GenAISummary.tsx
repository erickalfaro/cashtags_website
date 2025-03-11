// components/GenAISummary.tsx
"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { PostData } from "../types/api";

interface GenAISummaryProps {
  postsData: PostData[];
  loading: boolean;
  selectedStock: string | null;
}

export const GenAISummary: React.FC<GenAISummaryProps> = ({ postsData, loading, selectedStock }) => {
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [summary, setSummary] = useState<string>(""); // Initial state is empty
  const isStreamingRef = useRef<boolean>(false); // Track streaming state without re-renders

  const fetchSummaryStream = useCallback(async () => {
    if (isStreamingRef.current) {
      console.log("Streaming already in progress, skipping new fetch");
      return;
    }

    setIsStreaming(true);
    isStreamingRef.current = true;
    setSummary(""); // Clear previous content
    console.log(`Starting stream for ${selectedStock}, posts: ${postsData.length}`);

    try {
      const response = await fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ posts: postsData, ticker: selectedStock }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      if (!response.body) {
        throw new Error("Response body is null");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let chunkCount = 0;
      let accumulatedSummary = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log(`Stream completed, total chunks: ${chunkCount}`);
          // Remove trailing "..." from final result (from previous streaming tweak)
          accumulatedSummary = accumulatedSummary.replace(/\.\.\.$/, "");
          setSummary(accumulatedSummary);
          setIsStreaming(false);
          isStreamingRef.current = false;
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        chunkCount++;
        console.log(`Received chunk ${chunkCount}:`, chunk);
        accumulatedSummary += chunk;
        setSummary(accumulatedSummary); // Update state incrementally for Markdown rendering
      }
    } catch (error) {
      console.error("Error streaming summary:", error);
      setSummary("Failed to generate summary due to an error.");
      setIsStreaming(false);
      isStreamingRef.current = false;
    }
  }, [postsData, selectedStock]);

  useEffect(() => {
    if (!selectedStock || postsData.length === 0) {
      setSummary(""); // Changed to empty string to trigger placeholder
      setIsStreaming(false);
      isStreamingRef.current = false;
      return;
    }

    fetchSummaryStream();
  }, [fetchSummaryStream, selectedStock, postsData]); // Added dependencies

  return (
    <div className="GenAISummary container" key={selectedStock || "no-stock"}>
      <div className="container-header">
        ${selectedStock ? `${selectedStock} ` : ""} -
        <span style={{ color: "rgba(0, 230, 118)" }}> AI Summary</span>{/* Adjusted opacity from 1 to 0.3 per previous request */}
        {/* {loading ? " (Loading...)" : ""} */}
      </div>
      <div className="container-content relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--container-bg)] bg-opacity-75">
            <div className="spinner"></div>
          </div>
        )}
        <div className="w-full h-full overflow-auto text-sm GenAISummary-content relative">
          {summary ? (
            <ReactMarkdown>{summary}</ReactMarkdown>
          ) : (
            <div className="animated-placeholder absolute inset-0 flex items-center justify-center">
              <span>Click a $CASHTAG</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};