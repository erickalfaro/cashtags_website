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

// Register Chart.js components locally
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

interface MarketCanvasData {
  ticker: string;
  lineData: number[];
  barData: number[];
}

interface MarketCanvasProps {
  data: MarketCanvasData;
  selectedStock: string | null;
}

export const MarketCanvas: React.FC<MarketCanvasProps> = ({ data, selectedStock }) => {
  const hourlyLabels = data.lineData.length
    ? Array.from({ length: data.lineData.length }, (_, i) => {
        const date = new Date();
        date.setHours(date.getHours() - (data.lineData.length - 1 - i));
        return date;
      })
    : [];

  const config: ChartData<"bar" | "line"> = {
    labels: hourlyLabels,
    datasets: [
      {
        type: "line" as const,
        data: data.lineData,
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
        data: data.barData,
        backgroundColor: "rgba(128, 128, 128, 0.5)",
        borderColor: "rgba(128, 128, 128, 1)",
        borderWidth: 1,
        yAxisID: "yVolume",
      },
    ],
  };

  const priceMin = data.lineData.length ? Math.min(...data.lineData) : 0;
  const priceMax = data.lineData.length ? Math.max(...data.lineData) : 100;
  const priceRange = priceMax - priceMin;
  const buffer = priceRange * 0.1 || 10;
  const yPriceMin = priceMin - buffer;
  const yPriceMax = priceMax + buffer;

  const options: ChartOptions<"bar" | "line"> = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: 0,
    },
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: `$${selectedStock || "No Stock Selected"} - 7 Day Hourly Price & Volume`,
        color: "#c9d1d9",
        font: {
          size: 18,
          weight: "bold",
        },
        padding: {
          top: 5,
          bottom: 5,
        },
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
            if (isNoon) {
              return `${date.getDate().toString().padStart(2, "0")}-${(date.getMonth() + 1)
                .toString()
                .padStart(2, "0")}-${date.getFullYear().toString().slice(-2)}`;
            }
            return null;
          },
          color: "#c9d1d9",
          maxTicksLimit: 7,
          padding: 0,
        },
      },
      yPrice: {
        type: "linear" as const,
        position: "left" as const,
        title: {
          display: true,
          text: "Price ($)",
          color: "#c9d1d9",
          padding: 2,
        },
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
        title: {
          display: true,
          text: "Volume",
          color: "#c9d1d9",
          padding: 2,
        },
        grid: { display: false },
        ticks: {
          color: "#c9d1d9",
          callback: (value) => `${(Number(value) / 1000).toFixed(0)}K`,
          padding: 2,
        },
        max: data.barData.length ? Math.max(...data.barData) * 1.2 || 1000 : 1000,
      },
    },
  };

  return (
    <div className="mt-6 MarketCanvas">
      <div className="container-header">
        Market Canvas
      </div>
      <div className="rounded-b-md border border-gray-700">
        {data.lineData.length > 0 ? (
          <Chart type="bar" data={config} options={options} />
        ) : (
          <p className="text-center mt-20">No chart data available</p>
        )}
      </div>
    </div>
  );
};