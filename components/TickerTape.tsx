"use client";

import React from "react";
import { Sparklines, SparklinesLine } from "react-sparklines";

interface TickerTapeItem {
  id: number;
  cashtag: string;
  prev_open: number | null;
  prev_eod: number | null;
  latest_price: number | null;
  chng: number | null;
  trend: number[];
}

interface TickerTapeProps {
  data: TickerTapeItem[];
  loading: boolean;
  onTickerClick: (ticker: string) => void;
  onSort: (key: keyof TickerTapeItem) => void;
  sortConfig: { key: keyof TickerTapeItem | null; direction: "asc" | "desc" };
}

export const TickerTape: React.FC<TickerTapeProps> = ({
  data,
  loading,
  onTickerClick,
  onSort,
  sortConfig,
}) => {
  const getChangeColor = (change: number | null) =>
    change === null || change === undefined ? "" : change < 0 ? "text-red-500" : "text-green-500";

  return (
    <div className="mt-6 TickerTape">
      <div className="container-header">
        Ticker Tape {loading ? "(Updating...)" : ""}
      </div>
      <div className="container-content">
        <table className="border-collapse w-full">
          <thead>
            <tr className="bg-gray-800 text-center">
              <th
                className="border border-gray-700 p-1 text-center w-12 cursor-pointer"
                onClick={() => onSort("id")}
              >
                ID {sortConfig.key === "id" ? (sortConfig.direction === "asc" ? "↑" : "↓") : ""}
              </th>
              <th
                className="border border-gray-700 p-1 text-center w-20 cursor-pointer"
                onClick={() => onSort("cashtag")}
              >
                Stock {sortConfig.key === "cashtag" ? (sortConfig.direction === "asc" ? "↑" : "↓") : ""}
              </th>
              <th className="border border-gray-700 p-1 text-center w-32">Trend</th>
              <th
                className="border border-gray-700 p-1 text-center w-20 cursor-pointer"
                onClick={() => onSort("chng")}
              >
                Change {sortConfig.key === "chng" ? (sortConfig.direction === "asc" ? "↑" : "↓") : ""}
              </th>
              <th
                className="border border-gray-700 p-1 text-center w-24 cursor-pointer"
                onClick={() => onSort("latest_price")}
              >
                Latest Price {sortConfig.key === "latest_price" ? (sortConfig.direction === "asc" ? "↑" : "↓") : ""}
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
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? (
              data.map((item) => (
                <tr key={item.id} className="hover:bg-gray-800 text-center">
                  <td className="border border-gray-700 p-1 text-center w-12">{item.id}</td>
                  <td
                    className="border border-gray-700 p-1 cursor-pointer text-blue-400 hover:underline text-center w-20"
                    onClick={() => onTickerClick(item.cashtag)}
                  >
                    {item.cashtag}
                  </td>
                  <td className="border border-gray-700 p-0 text-center w-32">
                    <div className="w-full h-full overflow-hidden">
                      <Sparklines data={item.trend}>
                        <SparklinesLine color="white" style={{ strokeWidth: 1 }} />
                      </Sparklines>
                    </div>
                  </td>
                  <td className={`border border-gray-700 p-1 text-center w-20 ${getChangeColor(item.chng)}`}>
                    {item.chng !== null && item.chng !== undefined ? item.chng : "-"}
                  </td>
                  <td className="border border-gray-700 p-1 text-center w-24">
                    {item.latest_price !== null && item.latest_price !== undefined
                      ? `$${item.latest_price.toFixed(2)}`
                      : "-"}
                  </td>
                  <td className="border border-gray-700 p-1 text-center w-20">
                    {item.prev_eod !== null && item.prev_eod !== undefined ? item.prev_eod : "-"}
                  </td>
                  <td className="border border-gray-700 p-1 text-center w-20">
                    {item.prev_open !== null && item.prev_open !== undefined ? item.prev_open : "-"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="border border-gray-700 p-4 text-center">
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