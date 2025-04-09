// components/PostViewer.tsx
"use client";

import React from "react";
import { useSubscription } from "../lib/hooks";
import { User } from "@supabase/supabase-js";
import { PostData } from "../types/api"; // Import from types/api.ts, not lib/api.ts

interface PostViewerProps {
  data: PostData[];
  loading: boolean;
  selectedStock: string | null;
  user: User | null;
}

export const PostViewer: React.FC<PostViewerProps> = ({ data, loading, selectedStock, user }) => {
  const { subscription } = useSubscription(user);

  const handleItemClick = (item: PostData) => {
    if (item.tweet_id) {
      const url = `https://x.com/post/status/${item.tweet_id}`;
      window.open(url, "_blank");
    } else if (item.article_url) {
      window.open(item.article_url, "_blank");
    }
  };

  return (
    <div className="mt-6 PostViewer" key={selectedStock || "no-stock"}>
      <div className="container-header">
        Most Recent Posts & News {loading ? "(Loading...)" : ""}
      </div>
      <div className="container-content">
        {subscription.status === "FREE" ? (
          <div className="p-4 text-center text-gray-200">
            <p>Posts and news are available only to PREMIUM subscribers.</p>
            <p className="mt-2">Subscribe for $10/month to unlock this feature!</p>
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-800">
                <th className="border border-gray-700 p-1 text-center">Hours Ago</th>
                <th className="border border-gray-700 p-1 text-center">Post/News</th>
                <th className="border border-gray-700 p-1 text-center">Source</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} className="border border-gray-700 p-4 text-center">
                    Loading posts and news...
                  </td>
                </tr>
              ) : data.length > 0 ? (
                data.map((item, index) => (
                  <tr
                    key={index}
                    className="hover:bg-gray-800 cursor-pointer"
                    onClick={() => handleItemClick(item)}
                  >
                    <td className="border border-gray-700 p-1 text-center">{item.hours.toFixed(1)}</td>
                    <td className="border border-gray-700 p-1 text-left">{item.text}</td>
                    <td className="border border-gray-700 p-1 text-center">
                      {item.tweet_id ? "X Post" : "News Article"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="border border-gray-700 p-4 text-center">
                    No posts or news available for {selectedStock || "selected stock"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};