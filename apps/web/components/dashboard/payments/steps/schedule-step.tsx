"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  addDays,
  addMonths,
  addWeeks,
  format,
  isBefore,
  isSameDay,
  startOfDay,
} from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  CalendarDays,
  CalendarIcon,
  Repeat,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ScheduleStepProps {
  data: {
    scheduleTimes: number[];
    selectedDates: Date[];
    frequency: "once" | "daily" | "weekly" | "monthly" | "custom";
    endDate?: Date;
    repeatCount?: number;
  };
  updateData: (data: {
    scheduleTimes: number[];
    selectedDates: Date[];
    frequency: "once" | "daily" | "weekly" | "monthly" | "custom";
    endDate?: Date;
    repeatCount?: number;
  }) => void;
}

const FREQUENCY_OPTIONS = [
  { value: "once", label: "One-time" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "custom", label: "Custom" },
] as const;

function areNumberArraysEqual(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export default function ScheduleStep({ data, updateData }: ScheduleStepProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    data.selectedDates[0]
  );

  const repeatCount = data.repeatCount || 12;
  const recurringMode =
    data.frequency === "daily" ||
    data.frequency === "weekly" ||
    data.frequency === "monthly";

  useEffect(() => {
    const nextScheduleTimes = data.selectedDates.map((date) =>
      Math.floor(date.getTime() / 1000)
    );

    if (!areNumberArraysEqual(nextScheduleTimes, data.scheduleTimes)) {
      updateData({
        ...data,
        scheduleTimes: nextScheduleTimes,
      });
    }
  }, [data, data.scheduleTimes, data.selectedDates, updateData]);

  const scheduleSummary = useMemo(() => {
    if (data.selectedDates.length === 0) {
      return "No dates selected";
    }

    if (data.frequency === "custom" || data.frequency === "once") {
      return `${data.selectedDates.length} manual date${data.selectedDates.length === 1 ? "" : "s"}`;
    }

    return `${data.selectedDates.length} ${data.frequency} payment${data.selectedDates.length === 1 ? "" : "s"}`;
  }, [data]);

  const generateRecurringDates = (
    startDate: Date,
    frequency: "daily" | "weekly" | "monthly"
  ) => {
    const dates: Date[] = [startOfDay(startDate)];
    let currentDate = startOfDay(startDate);

    while (dates.length < repeatCount) {
      switch (frequency) {
        case "daily":
          currentDate = addDays(currentDate, 1);
          break;
        case "weekly":
          currentDate = addWeeks(currentDate, 1);
          break;
        case "monthly":
          currentDate = addMonths(currentDate, 1);
          break;
      }

      if (data.endDate && currentDate > data.endDate) {
        break;
      }

      dates.push(startOfDay(currentDate));
    }

    updateData({
      ...data,
      selectedDates: dates,
      frequency,
      repeatCount,
    });
  };

  const handleCalendarPick = (date: Date | undefined) => {
    if (!date || isBefore(date, startOfDay(new Date()))) {
      return;
    }

    if (recurringMode) {
      setSelectedDate(date);
      generateRecurringDates(
        date,
        data.frequency as "daily" | "weekly" | "monthly"
      );
      return;
    }

    const exists = data.selectedDates.some((item) => isSameDay(item, date));
    const nextDates = exists
      ? data.selectedDates.filter((item) => !isSameDay(item, date))
      : [...data.selectedDates, startOfDay(date)].sort(
          (a, b) => a.getTime() - b.getTime()
        );

    updateData({
      ...data,
      selectedDates: nextDates,
    });
  };

  const setFrequency = (
    value: "once" | "daily" | "weekly" | "monthly" | "custom"
  ) => {
    updateData({
      ...data,
      frequency: value,
      selectedDates:
        value === "custom" || value === "once" ? data.selectedDates : [],
      repeatCount,
    });

    if (
      selectedDate &&
      (value === "daily" || value === "weekly" || value === "monthly")
    ) {
      generateRecurringDates(selectedDate, value);
    }
  };

  const calendarClassNames = {
    day_selected:
      "bg-primary text-primary-foreground hover:bg-primary/90 focus:bg-primary/90",
    day_today: "ring-1 ring-primary/40 text-white",
    day: cn(
      "h-9 w-9 rounded-xl p-0 font-normal text-sm transition-all hover:bg-white/[0.08] hover:scale-105"
    ),
    head_cell: "text-slate-500 text-[11px] font-medium w-9",
    caption_label: "text-white text-sm font-medium",
    nav_button:
      "h-7 w-7 border border-white/[0.08] bg-white/[0.03] text-white hover:bg-white/[0.08] rounded-lg",
    cell: "text-center text-sm p-0.5",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="grid gap-5 xl:grid-cols-[minmax(0,1fr),260px]"
    >
      <section className="space-y-5">
        {/* Frequency tabs */}
        <div className="space-y-1.5">
          <Label className="text-sm text-slate-300">Schedule Mode</Label>
          <div className="flex flex-wrap gap-1.5 rounded-xl bg-white/[0.03] p-1">
            {FREQUENCY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFrequency(opt.value)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                  data.frequency === opt.value
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[220px,minmax(0,1fr)]">
          {/* Controls column */}
          <div className="space-y-4">
            {recurringMode && (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Occurrences</span>
                    <span className="font-medium text-white">{repeatCount}</span>
                  </div>
                  <Slider
                    value={[repeatCount]}
                    min={2}
                    max={24}
                    step={1}
                    onValueChange={(value) =>
                      updateData({
                        ...data,
                        repeatCount: value[0],
                      })
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs text-slate-400">Start Date</span>
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm text-slate-300">
                    {selectedDate
                      ? format(selectedDate, "MMM d, yyyy")
                      : "Pick a day →"}
                  </div>
                </div>
              </>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                updateData({
                  ...data,
                  selectedDates: [],
                  scheduleTimes: [],
                })
              }
              disabled={data.selectedDates.length === 0}
              className="w-full rounded-xl border-white/[0.08] bg-white/[0.02] text-xs text-slate-400 hover:bg-white/[0.05] hover:text-white"
            >
              <Trash2 className="mr-1.5 h-3 w-3" />
              Clear Dates
            </Button>
          </div>

          {/* Calendar */}
          <div className="overflow-x-auto rounded-xl border border-white/[0.06] bg-white/[0.015] p-3">
            {recurringMode ? (
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(value: Date | undefined) => handleCalendarPick(value)}
                disabled={(date) => isBefore(date, startOfDay(new Date()))}
                className="min-w-[260px] text-white sm:min-w-0"
                classNames={calendarClassNames}
              />
            ) : (
              <Calendar
                mode="multiple"
                selected={data.selectedDates}
                onSelect={(value: Date[] | undefined) => {
                  updateData({
                    ...data,
                    selectedDates: (value ?? [])
                      .map((item) => startOfDay(item))
                      .sort((a, b) => a.getTime() - b.getTime()),
                  });
                }}
                disabled={(date) => isBefore(date, startOfDay(new Date()))}
                className="min-w-[260px] text-white sm:min-w-0"
                classNames={calendarClassNames}
              />
            )}
          </div>
        </div>
      </section>

      {/* Sidebar */}
      <aside className="space-y-3">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <div className="flex items-center gap-2">
            {recurringMode ? (
              <Repeat className="h-4 w-4 text-primary" />
            ) : (
              <CalendarDays className="h-4 w-4 text-primary" />
            )}
            <span className="text-xs font-medium text-slate-400">{scheduleSummary}</span>
          </div>

          <div className="mt-3 space-y-1.5">
            {data.selectedDates.length > 0 ? (
              <>
                {data.selectedDates.slice(0, 6).map((date, i) => (
                  <motion.div
                    key={date.toISOString()}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-center justify-between rounded-lg border border-white/[0.05] bg-white/[0.015] px-2.5 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-3 w-3 text-slate-500" />
                      <span className="text-xs text-white">
                        {format(date, "MMM d, yyyy")}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500">
                      {format(date, "EEE")}
                    </span>
                  </motion.div>
                ))}

                {data.selectedDates.length > 6 && (
                  <div className="pt-1 text-center text-[11px] text-slate-500">
                    +{data.selectedDates.length - 6} more
                  </div>
                )}
              </>
            ) : (
              <p className="py-3 text-center text-xs text-slate-500">
                Select dates on the calendar.
              </p>
            )}
          </div>
        </div>
      </aside>
    </motion.div>
  );
}
