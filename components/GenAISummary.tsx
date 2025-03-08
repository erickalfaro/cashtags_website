// components/GenAISummary.tsx
"use client";

import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { PostData } from "../types/api"; // Updated

interface GenAISummaryProps {
  postsData: PostData[];
  loading: boolean;
  selectedStock: string | null;
}

export const GenAISummary: React.FC<GenAISummaryProps> = ({ postsData, loading, selectedStock }) => {
  const [summary, setSummary] = useState<string>("");
  const [summaryLoading, setSummaryLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchSummary = async () => {
      if (!postsData.length || !selectedStock) {
        setSummary(`No posts available to summarize for ${selectedStock || "no ticker"}.`);
        return;
      }

      setSummaryLoading(true);
      try {
        const response = await fetch("/api/summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ posts: postsData, ticker: selectedStock }),
        });

        if (!response.ok) throw new Error("Failed to fetch summary");
        const { summary } = await response.json();
        setSummary(summary);
      } catch (error) {
        console.error("Error fetching summary:", error);
        setSummary("Error generating summary.");
      } finally {
        setSummaryLoading(false);
      }
    };

    fetchSummary();
  }, [postsData, selectedStock]);

  return (
    <div className="mt-6 GenAISummary">
      <div className="container-header">
        GenAI Summary {loading || summaryLoading ? "(Loading...)" : ""}
      </div>
      <div className="container-content p-4 relative">
        {summaryLoading && (
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