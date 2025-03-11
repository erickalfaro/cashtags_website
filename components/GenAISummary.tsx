// components/GenAISummary.tsx
"use client";

import React, { useEffect, useState, useCallback, useRef } from "react"; // Added useRef
import ReactMarkdown from "react-markdown";
import { PostData } from "../types/api";

interface GenAISummaryProps {
  postsData: PostData[];
  loading: boolean;
  selectedStock: string | null;
}

export const GenAISummary: React.FC<GenAISummaryProps> = ({ postsData, loading, selectedStock }) => {
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [summary, setSummary] = useState<string>("");
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
      setSummary("No summary available. Select a stock and ensure posts are loaded.");
      setIsStreaming(false);
      isStreamingRef.current = false;
      return;
    }

    fetchSummaryStream();
  }, [fetchSummaryStream]);

  return (
    <div className="GenAISummary container" key={selectedStock || "no-stock"}>
      <div className="container-header">
        AI Summary for {selectedStock ? `$${selectedStock}` : "Selected Stock"}{" "}
        {loading ? "(Loading Posts...)" : isStreaming ? "(Generating Summary...)" : ""}
      </div>
      <div className="container-content relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--container-bg)] bg-opacity-75">
            <div className="spinner"></div>
          </div>
        )}
        <div className="w-full h-full overflow-auto text-sm GenAISummary-content">
          <ReactMarkdown>{summary}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
};