// components/StockOverview.tsx
"use client";

import React, { useRef, useEffect } from "react";
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
    timestamps?: string[];
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
  const chartRef = useRef<ChartJS<"bar" | "line">>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  const formatMagnitude = (value: number): string => {
    if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
    return value.toFixed(0);
  };

  const filterWeekends = (
    timestamps: string[],
    lineData: number[],
    barData: number[]
  ): { filteredTimestamps: Date[]; filteredLineData: number[]; filteredBarData: number[]; labels: string[] } => {
    const filtered = timestamps
      .map((ts, index) => {
        const date = new Date(ts);
        return {
          timestamp: date,
          line: lineData[index],
          bar: barData[index],
          day: date.getUTCDay(),
        };
      })
      .filter((item) => item.day !== 0 && item.day !== 6);

    const labels = filtered.map((item) =>
      item.timestamp.toLocaleString("en-US", { month: "short", day: "numeric" })
    );

    return {
      filteredTimestamps: filtered.map((item) => item.timestamp),
      filteredLineData: filtered.map((item) => item.line),
      filteredBarData: filtered.map((item) => item.bar),
      labels,
    };
  };

  const rawTimestamps = data.marketCanvas.timestamps?.length
    ? data.marketCanvas.timestamps
    : data.marketCanvas.lineData.length
    ? Array.from({ length: data.marketCanvas.lineData.length }, (_, i) => {
        const date = new Date();
        date.setHours(date.getHours() - (data.marketCanvas.lineData.length - 1 - i));
        date.setMinutes(0, 0, 0);
        return date.toISOString();
      })
    : [];

  const { filteredTimestamps, filteredLineData, filteredBarData, labels } = filterWeekends(
    rawTimestamps,
    data.marketCanvas.lineData,
    data.marketCanvas.barData
  );

  const chartData: ChartData<"bar" | "line"> = {
    labels: labels,
    datasets: [
      {
        type: "line" as const,
        label: "Price ($)",
        data: filteredLineData,
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
        label: "Volume",
        data: filteredBarData,
        backgroundColor: "rgba(128, 128, 128, 0.5)",
        borderColor: "rgba(128, 128, 128, 1)",
        borderWidth: 1,
        yAxisID: "yVolume",
      },
    ],
  };

  const priceMin = filteredLineData.length ? Math.min(...filteredLineData) : 0;
  const priceMax = filteredLineData.length ? Math.max(...filteredLineData) : 100;
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
        font: { size: 16, weight: "bold" },
        padding: { top: 5, bottom: 5 },
      },
      tooltip: {
        enabled: false,
        external: (context) => {
          const { chart, tooltip } = context;
          let tooltipEl = tooltipRef.current;

          if (!tooltipEl) {
            tooltipEl = document.createElement("div");
            tooltipEl.className = "chart-tooltip";
            chartContainerRef.current?.appendChild(tooltipEl);
            tooltipRef.current = tooltipEl;
          }

          if (tooltip.opacity === 0) {
            tooltipEl.style.opacity = "0";
            tooltipEl.style.transition = "opacity 0.1s ease-out"; // Smooth fade out
            return;
          }

          const dataIndex = tooltip.dataPoints[0]?.dataIndex;
          if (dataIndex === undefined) return;

          const date = filteredTimestamps[dataIndex];
          const price = filteredLineData[dataIndex];
          const volume = filteredBarData[dataIndex] ?? 0;

          tooltipEl.innerHTML = `
            <div class="bg-[rgba(22,27,34,0.9)] text-white p-2 rounded-lg border border-[rgba(0,230,118,0.7)] shadow-lg text-xs max-w-[150px]">
              <div class="font-bold">${date.toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}</div>
              <div>Price: $${price.toFixed(2)}</div>
              <div>Volume: ${formatMagnitude(volume)}</div>
            </div>
          `;

          tooltipEl.style.opacity = "1";
          tooltipEl.style.transition = "left 0.1s ease-out, top 0.1s ease-out, opacity 0.1s ease-out"; // Smooth movement
          const chartArea = chart.chartArea;

          const tooltipWidth = tooltipEl.offsetWidth;
          const tooltipHeight = tooltipEl.offsetHeight;

          // Offset values
          const xOffset = 20; // Pixels to the right of the cursor
          const yOffset = 20; // Pixels below the cursor

          // X position: Offset right from caretX, clamp within plot area
          let xPosition = tooltip.caretX + xOffset;
          if (xPosition + tooltipWidth > chartArea.right) {
            xPosition = tooltip.caretX - tooltipWidth - xOffset; // Flip to left if overflowing right
          }
          xPosition = Math.max(chartArea.left, Math.min(xPosition, chartArea.right - tooltipWidth));

          // Y position: Offset below caretY if space, above if not, clamp within plot area
          let yPosition;
          const spaceBelow = chartArea.bottom - tooltip.caretY;
          if (spaceBelow >= tooltipHeight + yOffset) {
            yPosition = tooltip.caretY + yOffset; // Below cursor
          } else {
            yPosition = tooltip.caretY - tooltipHeight - yOffset; // Above cursor
          }
          yPosition = Math.max(chartArea.top, Math.min(yPosition, chartArea.bottom - tooltipHeight));

          tooltipEl.style.position = "absolute";
          tooltipEl.style.left = `${xPosition}px`;
          tooltipEl.style.top = `${yPosition}px`;
          tooltipEl.style.pointerEvents = "none";
        },
      },
    },
    scales: {
      x: {
        type: "category",
        labels: labels,
        grid: { display: false },
        ticks: { display: false },
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
          callback: (value) => formatMagnitude(Number(value)),
          padding: 2,
        },
        max: filteredBarData.length ? Math.max(...filteredBarData) * 1.2 || 1000 : 1000,
      },
    },
    interaction: {
      mode: "index",
      intersect: false,
    },
  };

  useEffect(() => {
    const currentTooltip = tooltipRef.current;
    return () => {
      if (currentTooltip && chartContainerRef.current?.contains(currentTooltip)) {
        chartContainerRef.current.removeChild(currentTooltip);
      }
    };
  }, []);

  return (
    <div className="StockOverview container mt-5">
      <div className="container-header">
        Stock Overview {loading ? "(Loading...)" : ""}
      </div>
      <div className="container-content p-0 flex flex-col">
        <div className="chart-section relative border-b border-[var(--border-color)]">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-[var(--container-bg)] bg-opacity-75">
              <div className="spinner"></div>
            </div>
          )}
          <div
            ref={chartContainerRef}
            className="chart-wrapper p-[var(--spacing-md)] relative"
            style={{ height: "var(--stock-overview-chart-height)" }}
          >
            {filteredLineData.length > 0 ? (
              <Chart ref={chartRef} type="bar" data={chartData} options={chartOptions} />
            ) : (
              <p className="text-center text-[var(--text-primary)] absolute inset-0 flex items-center justify-center">
                No chart data available
              </p>
            )}
          </div>
        </div>
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