"use client";

import { useRef } from "react";
import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Line, Pie } from "react-chartjs-2";

// Register Chart.js components
Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
);

// Common chart options
const commonOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "top" as const,
      labels: {
        color: "rgba(255, 255, 255, 0.7)",
        font: {
          family: "Inter, sans-serif",
        },
      },
    },
    tooltip: {
      backgroundColor: "rgba(17, 17, 27, 0.9)",
      titleColor: "rgba(255, 255, 255, 0.9)",
      bodyColor: "rgba(255, 255, 255, 0.7)",
      borderColor: "rgba(255, 255, 255, 0.1)",
      borderWidth: 1,
      padding: 10,
      boxPadding: 5,
      usePointStyle: true,
      bodyFont: {
        family: "Inter, sans-serif",
      },
      titleFont: {
        family: "Inter, sans-serif",
        weight: "bold",
      },
    },
  },
  scales: {
    x: {
      grid: {
        color: "rgba(255, 255, 255, 0.05)",
      },
      ticks: {
        color: "rgba(255, 255, 255, 0.7)",
        font: {
          family: "Inter, sans-serif",
        },
      },
    },
    y: {
      grid: {
        color: "rgba(255, 255, 255, 0.05)",
      },
      ticks: {
        color: "rgba(255, 255, 255, 0.7)",
        font: {
          family: "Inter, sans-serif",
        },
      },
    },
  },
};

// Line Chart Component
export function LineChart({ data }: { data: any }) {
  const chartRef = useRef<Chart | null>(null);

  const options = {
    ...commonOptions,
    elements: {
      line: {
        tension: 0.3,
      },
      point: {
        radius: 2,
        hoverRadius: 5,
      },
    },
  };

  return <Line ref={chartRef} data={data} options={options} />;
}

// Bar Chart Component
export function BarChart({ data }: { data: any }) {
  const chartRef = useRef<Chart | null>(null);

  const options = {
    ...commonOptions,
    barPercentage: 0.6,
    categoryPercentage: 0.7,
  };

  return <Bar ref={chartRef} data={data} options={options} />;
}

// Pie Chart Component
export function PieChart({ data }: { data: any }) {
  const chartRef = useRef<Chart | null>(null);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right" as const,
        labels: {
          color: "rgba(255, 255, 255, 0.7)",
          font: {
            family: "Inter, sans-serif",
          },
          padding: 15,
        },
      },
      tooltip: {
        backgroundColor: "rgba(17, 17, 27, 0.9)",
        titleColor: "rgba(255, 255, 255, 0.9)",
        bodyColor: "rgba(255, 255, 255, 0.7)",
        borderColor: "rgba(255, 255, 255, 0.1)",
        borderWidth: 1,
        padding: 10,
        boxPadding: 5,
        usePointStyle: true,
      },
    },
  };

  return <Pie ref={chartRef} data={data} options={options} />;
}
