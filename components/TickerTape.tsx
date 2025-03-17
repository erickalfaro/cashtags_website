// components/TickerTape.tsx
"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Sparklines, SparklinesLine } from "react-sparklines";
import { useSubscription } from "../lib/hooks";
import { TickerTapeProps } from "../types/components";
import { TickerTapeItem, TopicItem } from "../types/api";

export const TickerTape: React.FC<TickerTapeProps> = ({
  data,
  loading,
  onTickerClick,
  onSort,
  sortConfig,
  user,
  pageMode,
}) => {
  const { subscription } = useSubscription(user);
  const [updatedKeys, setUpdatedKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!loading && data.length > 0) {
      const newUpdatedKeys = new Set<string>();
      data.forEach((item) => {
        newUpdatedKeys.add(item.key!);
      });

      setUpdatedKeys(newUpdatedKeys);
      const timer = setTimeout(() => setUpdatedKeys(new Set()), 1000);
      return () => clearTimeout(timer);
    }
  }, [data, loading]);

  const getChangeColor = (change: number | null) =>
    change === null || change === undefined ? "" : change < 0 ? "text-red-500" : "text-green-500";

  const isCashtagsMode = pageMode === "cashtags";

  const headerText = useMemo(() => {
    return `Top Trending on ${isCashtagsMode ? "Socials" : "Topics"} ${loading ? "(Updating...)" : ""}`;
  }, [isCashtagsMode, loading]);

  return (
    <div className={`mt-6 TickerTape ${pageMode === "topics" ? "topics-mode" : ""}`} key={pageMode}>
      <div className="container-header relative flex justify-center items-center px-3 py-2">
        <span className="text-center">{headerText}</span>
        <span className="absolute right-3 text-sm">
          {subscription.status === "PREMIUM" ? (
            <span className="text-lg font-bold text-red-500 animate-pulse-live">LIVE</span>
          ) : (
            <span className="text-gray-500">(Subscribe for real-time updates)</span>
          )}
        </span>
      </div>
      <div className="container-content">
        <table className="border-collapse w-full">
          <thead>
            <tr className="bg-gray-800 text-center">
              <th className="border border-gray-700 p-1 text-center w-12 cursor-pointer" onClick={() => onSort("id")}>
                Sort {sortConfig.key === "id" ? (sortConfig.direction === "asc" ? "↑" : "↓") : ""}
              </th>
              <th
                className="border border-gray-700 p-1 text-center w-20 cursor-pointer"
                onClick={() => onSort(isCashtagsMode ? "cashtag" : "topic")}
              >
                {isCashtagsMode ? (
                  <span style={{ color: "rgba(0, 230, 118, 1)" }}>$</span>
                ) : null}
                {isCashtagsMode ? "CASHTAG" : "Topic"}
                {sortConfig.key === (isCashtagsMode ? "cashtag" : "topic")
                  ? sortConfig.direction === "asc"
                    ? "↑"
                    : "↓"
                  : ""}
              </th>
              <th className="border border-gray-700 p-1 text-center w-32">Mentions</th>
              {isCashtagsMode && (
                <>
                  <th
                    className="border border-gray-700 p-1 text-center w-20 cursor-pointer"
                    onClick={() => onSort("chng")}
                  >
                    % Change {sortConfig.key === "chng" ? (sortConfig.direction === "asc" ? "↑" : "↓") : ""}
                  </th>
                  <th
                    className="border border-gray-700 p-1 text-center w-24 cursor-pointer"
                    onClick={() => onSort("latest_price")}
                  >
                    Latest Price{" "}
                    {sortConfig.key === "latest_price" ? (sortConfig.direction === "asc" ? "↑" : "↓") : ""}
                  </th>
                  <th
                    className="border border-gray-700 p-1 text-center w-20 cursor-pointer"
                    onClick={() => onSort("prev_eod")}
                  >
                    Prev EOD {sortConfig.key === "prev_eod" ? (sortConfig.direction === "asc" ? "↑" : "↓") : ""}
                  </th>
                  <th
                    className="border border-gray-700 p-1 text-center w-20 cursor-pointer"
                    onClick={() => onSort("prev_open")}
                  >
                    Prev Open {sortConfig.key === "prev_open" ? (sortConfig.direction === "asc" ? "↑" : "↓") : ""}
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? (
              data.map((item) => {
                const isTopicItem = "topic" in item;
                return (
                  <tr
                    key={item.key}
                    className={`hover:bg-gray-800 text-center ${
                      updatedKeys.has(item.key!) ? "animate-row-update" : ""
                    }`}
                  >
                    <td className="border border-gray-700 p-1 text-center w-12">{item.id}</td>
                    <td
                      className="cashtag-cell border border-gray-700 p-1 text-center w-20"
                      onClick={() => onTickerClick(isTopicItem ? (item as TopicItem).topic : (item as TickerTapeItem).cashtag)}
                    >
                      {isTopicItem ? (item as TopicItem).topic : `$${(item as TickerTapeItem).cashtag}`}
                    </td>
                    <td className="border border-gray-700 p-1 text-center w-32">
                      <div className="w-full h-full overflow-hidden">
                        <Sparklines data={item.trend}>
                          <SparklinesLine color="rgb(255, 255, 255)" style={{ strokeWidth: 1 }} />
                        </Sparklines>
                      </div>
                    </td>
                    {isCashtagsMode && (
                      <>
                        <td
                          className={`border border-gray-700 p-1 text-center w-20 ${getChangeColor(
                            (item as TickerTapeItem).chng
                          )}`}
                        >
                          {(item as TickerTapeItem).chng !== null &&
                          (item as TickerTapeItem).chng !== undefined
                            ? `${(item as TickerTapeItem).chng}%`
                            : "-"}
                        </td>
                        <td className="border border-gray-700 p-1 text-center w-24">
                          {(item as TickerTapeItem).latest_price !== null &&
                          (item as TickerTapeItem).latest_price !== undefined
                            ? `$${(item as TickerTapeItem).latest_price!.toFixed(2)}`
                            : "-"}
                        </td>
                        <td className="border border-gray-700 p-1 text-center w-20">
                          {(item as TickerTapeItem).prev_eod !== null &&
                          (item as TickerTapeItem).prev_eod !== undefined
                            ? (item as TickerTapeItem).prev_eod
                            : "-"}
                        </td>
                        <td className="border border-gray-700 p-1 text-center w-20">
                          {(item as TickerTapeItem).prev_open !== null &&
                          (item as TickerTapeItem).prev_open !== undefined
                            ? (item as TickerTapeItem).prev_open
                            : "-"}
                        </td>
                      </>
                    )}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={isCashtagsMode ? 7 : 3} className="border border-gray-700 p-4 text-center">
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};