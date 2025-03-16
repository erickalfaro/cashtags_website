// components/GenAISummary.tsx
"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { PostData } from "../types/api";

interface GenAISummaryProps {
  postsData: PostData[];
  loading: boolean;
  selectedStock: string | null;
  pageMode: "cashtags" | "topics"; // Add pageMode prop
}

export const GenAISummary: React.FC<GenAISummaryProps> = ({ postsData, loading, selectedStock, pageMode }) => {
  const [summary, setSummary] = useState<string>("");
  const isStreamingRef = useRef<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const latestStockRef = useRef<string | null>(null);

  const fetchSummaryStream = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      isStreamingRef.current = false;
      setSummary("");
    }

    if (!selectedStock || postsData.length === 0) {
      setSummary("");
      isStreamingRef.current = false;
      return;
    }

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    isStreamingRef.current = true;
    latestStockRef.current = selectedStock;

    console.log(`Starting stream for ${selectedStock}, posts: ${postsData.length}`);

    try {
      const response = await fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ posts: postsData, ticker: selectedStock }),
        signal,
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
          console.log(`Stream completed for ${selectedStock}, total chunks: ${chunkCount}`);
          accumulatedSummary = accumulatedSummary.replace(/\.\.\.$/, "");
          if (latestStockRef.current === selectedStock) {
            setSummary(accumulatedSummary);
          }
          isStreamingRef.current = false;
          break;
        }
        if (signal.aborted) {
          console.log(`Stream for ${selectedStock} aborted`);
          isStreamingRef.current = false;
          break;
        }
        if (latestStockRef.current !== selectedStock) {
          console.log(`Discarding stream for ${selectedStock} as a newer request started`);
          isStreamingRef.current = false;
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        chunkCount++;
        console.log(`Received chunk ${chunkCount} for ${selectedStock}:`, chunk);
        accumulatedSummary += chunk;
        if (latestStockRef.current === selectedStock) {
          setSummary(accumulatedSummary);
        }
      }
    } catch (error) {
      if (signal.aborted) {
        console.log(`Request for ${selectedStock} was canceled`);
      } else {
        console.error("Error streaming summary:", error);
        if (latestStockRef.current === selectedStock) {
          setSummary("Failed to generate summary due to an error.");
        }
      }
      isStreamingRef.current = false;
    }
  }, [postsData, selectedStock]);

  useEffect(() => {
    if (!selectedStock || postsData.length === 0) {
      setSummary("");
      isStreamingRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      return;
    }

    fetchSummaryStream();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchSummaryStream, selectedStock, postsData]);

  return (
    <div className="GenAISummary container" key={selectedStock || "no-stock"}>
      <div className="container-header">
        {selectedStock ? `$${selectedStock} - ` : ""}
        <span style={{ color: "rgba(0, 230, 118)" }}>AI Summary</span>
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
              <span>{pageMode === "cashtags" ? "Click a $CASHTAG" : "Click a Topic"}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};