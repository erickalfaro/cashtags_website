// components/StockOverview.tsx
"use client";

import React from "react";
import { Chart } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineController,
  BarController,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  TimeScale,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import "chartjs-adapter-date-fns";
import { ChartData, ChartOptions } from "chart.js";

ChartJS.register(
  LineController,
  BarController,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  TimeScale,
  Title,
  Tooltip,
  Legend
);

interface StockOverviewData {
  marketCanvas: {
    ticker: string;
    lineData: number[];
    barData: number[];
  };
  stockLedger: {
    stockName: string;
    description: string;
    marketCap: string;
  };
}

interface StockOverviewProps {
  data: StockOverviewData;
  selectedStock: string | null;
  loading: boolean;
}

export const StockOverview: React.FC<StockOverviewProps> = ({ data, selectedStock, loading }) => {
  const hourlyLabels = data.marketCanvas.lineData.length
    ? Array.from({ length: data.marketCanvas.lineData.length }, (_, i) => {
        const date = new Date();
        date.setHours(date.getHours() - (data.marketCanvas.lineData.length - 1 - i));
        return date;
      })
    : [];

  const chartData: ChartData<"bar" | "line"> = {
    labels: hourlyLabels,
    datasets: [
      {
        type: "line" as const,
        data: data.marketCanvas.lineData,
        borderColor: "#00C805",
        backgroundColor: "rgba(0, 200, 5, 0.1)",
        fill: false,
        yAxisID: "yPrice",
        tension: 0.1,
        pointRadius: 0,
        borderWidth: 1,
      },
      {
        type: "bar" as const,
        data: data.marketCanvas.barData,
        backgroundColor: "rgba(128, 128, 128, 0.5)",
        borderColor: "rgba(128, 128, 128, 1)",
        borderWidth: 1,
        yAxisID: "yVolume",
      },
    ],
  };

  const priceMin = data.marketCanvas.lineData.length ? Math.min(...data.marketCanvas.lineData) : 0;
  const priceMax = data.marketCanvas.lineData.length ? Math.max(...data.marketCanvas.lineData) : 100;
  const priceRange = priceMax - priceMin;
  const buffer = priceRange * 0.1 || 10;
  const yPriceMin = priceMin - buffer;
  const yPriceMax = priceMax + buffer;

  const chartOptions: ChartOptions<"bar" | "line"> = {
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: 0 },
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: `$${selectedStock || "No Stock Selected"} - 7 Day Hourly Price & Volume`,
        color: "#c9d1d9",
        font: { size: 16, weight: "bold" }, // Match container-header font size
        padding: { top: 5, bottom: 5 },
      },
      tooltip: {
        mode: "index",
        intersect: false,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "#fff",
        bodyColor: "#fff",
        callbacks: {
          title: () => "",
          label: (context) => (context.datasetIndex === 0 ? `$${context.parsed.y.toFixed(2)}` : ""),
        },
      },
    },
    scales: {
      x: {
        type: "time" as const,
        time: {
          unit: "day",
          displayFormats: { day: "DD-dd-yy" },
          tooltipFormat: "MM-dd-yy HH:mm",
        },
        grid: { display: false },
        ticks: {
          source: "auto",
          callback: (value) => {
            const date = new Date(value);
            const isNoon = date.getHours() === 12 && date.getMinutes() === 0;
            return isNoon
              ? `${date.getDate().toString().padStart(2, "0")}-${(date.getMonth() + 1)
                  .toString()
                  .padStart(2, "0")}-${date.getFullYear().toString().slice(-2)}`
              : null;
          },
          color: "#c9d1d9",
          maxTicksLimit: 7,
          padding: 0,
        },
      },
      yPrice: {
        type: "linear" as const,
        position: "left" as const,
        title: { display: true, text: "Price ($)", color: "#c9d1d9", padding: 2 },
        grid: { color: "#30363d" },
        ticks: {
          color: "#c9d1d9",
          callback: (value) => `$${Number(value).toFixed(2)}`,
          padding: 2,
        },
        min: yPriceMin,
        max: yPriceMax,
      },
      yVolume: {
        type: "linear" as const,
        position: "right" as const,
        title: { display: true, text: "Volume", color: "#c9d1d9", padding: 2 },
        grid: { display: false },
        ticks: {
          color: "#c9d1d9",
          callback: (value) => `${(Number(value) / 1000).toFixed(0)}K`,
          padding: 2,
        },
        max: data.marketCanvas.barData.length ? Math.max(...data.marketCanvas.barData) * 1.2 || 1000 : 1000,
      },
    },
  };

  return (
    <div className="StockOverview container mt-5">
      <div className="container-header">
        Stock Overview {loading ? "(Loading...)" : ""}
      </div>
      <div className="container-content p-0 flex flex-col">
        {/* Chart Section */}
        <div className="chart-section relative border-b border-[var(--border-color)]">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-[var(--container-bg)] bg-opacity-75">
              <div className="spinner"></div>
            </div>
          )}
          <div className="chart-wrapper p-[var(--spacing-md)]" style={{ height: "var(--stock-overview-chart-height)" }}>
            {data.marketCanvas.lineData.length > 0 ? (
              <Chart type="bar" data={chartData} options={chartOptions} />
            ) : (
              <p className="text-center text-[var(--text-primary)] absolute inset-0 flex items-center justify-center">
                No chart data available
              </p>
            )}
          </div>
        </div>
        {/* Table Section */}
        <div className="table-section">
          <table className="w-full border-collapse bg-[var(--container-bg)] text-[11px]">
            <thead>
              <tr className="bg-[var(--header-gradient-start)]">
                <th className="border border-[var(--border-color)] p-[6px_8px] text-center font-bold text-gray-200" style={{ width: "25%" }}>
                  Stock Name
                </th>
                <th className="border border-[var(--border-color)] p-[6px_8px] text-center font-bold text-gray-200" style={{ width: "50%" }}>
                  Description
                </th>
                <th className="border border-[var(--border-color)] p-[6px_8px] text-center font-bold text-gray-200" style={{ width: "25%" }}>
                  Market Cap
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="hover:bg-gray-800 transition-colors duration-200 ease-in">
                <td className="border border-[var(--border-color)] p-[6px_8px] text-center text-[var(--text-primary)]" style={{ width: "25%" }}>
                  {data.stockLedger.stockName || "-"}
                </td>
                <td className="border border-[var(--border-color)] p-[6px_8px] text-center text-[var(--text-primary)]" style={{ width: "50%" }}>
                  {data.stockLedger.description || "-"}
                </td>
                <td className="border border-[var(--border-color)] p-[6px_8px] text-center text-[var(--text-primary)]" style={{ width: "25%" }}>
                  {data.stockLedger.marketCap || "-"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};