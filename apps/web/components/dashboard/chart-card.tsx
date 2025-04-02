"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, LineChart, PieChart } from "@/components/dashboard/charts";
import { cn } from "@/lib/utils";

interface ChartCardProps {
  title: string;
  description?: string;
  tabs?: string[];
  defaultTab?: string;
  chartType: "bar" | "line" | "pie";
  // eslint-disable-next-line
  data: any;
  className?: string;
}

export default function ChartCard({
  title,
  description,
  tabs = ["7d", "30d", "90d", "All"],
  defaultTab = "7d",
  chartType,
  data,
  className,
}: ChartCardProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  const renderChart = () => {
    switch (chartType) {
      case "bar":
        return <BarChart data={data[activeTab]} />;
      case "line":
        return <LineChart data={data[activeTab]} />;
      case "pie":
        return <PieChart data={data[activeTab]} />;
      default:
        return null;
    }
  };

  return (
    <Card className={cn("bg-dark-200 border-white/10 text-white", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {description && (
            <p className="text-xs text-white/70 mt-1">{description}</p>
          )}
        </div>
        <Tabs
          defaultValue={defaultTab}
          onValueChange={setActiveTab}
          className="w-auto"
        >
          <TabsList className="bg-dark-300 border border-white/10">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab}
                className="data-[state=active]:bg-[#6E56CF] data-[state=active]:text-white"
              >
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">{renderChart()}</div>
      </CardContent>
    </Card>
  );
}
