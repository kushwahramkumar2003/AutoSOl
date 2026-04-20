"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { addDays, addMonths, addWeeks, format, isBefore, isSameDay, startOfDay } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Clock, Info, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  data: {
    scheduleTimes: number[];
    selectedDates: Date[];
    frequency: "once" | "daily" | "weekly" | "monthly" | "custom";
    executionHour: number;
    executionMinute: number;
    timezone: string;
    endDate?: Date;
    repeatCount?: number;
  };
  updateData: (d: Props["data"]) => void;
}

const FREQ = [
  { value: "once", label: "One-time" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "custom", label: "Custom" },
] as const;

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

function getTimeZoneOffsetMs(timestampMs: number, timeZone: string): number {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(new Date(timestampMs));
  const lookup = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value ?? "0");

  const asUtc = Date.UTC(
    lookup("year"),
    lookup("month") - 1,
    lookup("day"),
    lookup("hour"),
    lookup("minute"),
    lookup("second")
  );

  return asUtc - timestampMs;
}

function zonedDateTimeToEpochSeconds(
  date: Date,
  hour: number,
  minute: number,
  timeZone: string
): number {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  const wallClockMs = Date.UTC(year, month, day, hour, minute, 0);

  let utcMs = wallClockMs;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const offsetMs = getTimeZoneOffsetMs(utcMs, timeZone);
    const nextUtcMs = wallClockMs - offsetMs;
    if (nextUtcMs === utcMs) {
      break;
    }
    utcMs = nextUtcMs;
  }

  return Math.floor(utcMs / 1000);
}

function areNumberArraysEqual(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export default function ScheduleSection({ data, updateData }: Props) {
  const [startDate, setStartDate] = useState<Date | undefined>(data.selectedDates[0]);
  const [supportedTimezones, setSupportedTimezones] = useState<string[]>(["UTC"]);
  const count = data.repeatCount || 12;
  const recurring = data.frequency === "daily" || data.frequency === "weekly" || data.frequency === "monthly";

  useEffect(() => {
    const resolved = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    const supportedValuesOf = (Intl as unknown as Intl.DateTimeFormatConstructor & {
      supportedValuesOf?: (key: "timeZone") => string[];
    }).supportedValuesOf;
    const list =
      typeof supportedValuesOf === "function"
        ? supportedValuesOf("timeZone")
        : [resolved, "UTC"];
    const unique = Array.from(new Set([resolved, ...list]));
    setSupportedTimezones(unique);

    if (!data.timezone) {
      updateData({ ...data, timezone: resolved });
    }
  }, [data, data.timezone, updateData]);

  // Sync scheduleTimes with dates + time
  useEffect(() => {
    const times = data.selectedDates.map((date) =>
      zonedDateTimeToEpochSeconds(
        date,
        data.executionHour,
        data.executionMinute,
        data.timezone || "UTC"
      )
    );
    if (!areNumberArraysEqual(times, data.scheduleTimes)) {
      updateData({ ...data, scheduleTimes: times });
    }
  }, [
    data,
    data.selectedDates,
    data.executionHour,
    data.executionMinute,
    data.timezone,
    data.scheduleTimes,
    updateData,
  ]);

  const genRecurring = (start: Date, freq: "daily" | "weekly" | "monthly") => {
    const dates: Date[] = [startOfDay(start)];
    let cur = startOfDay(start);
    while (dates.length < count) {
      cur = freq === "daily" ? addDays(cur, 1) : freq === "weekly" ? addWeeks(cur, 1) : addMonths(cur, 1);
      if (data.endDate && cur > data.endDate) break;
      dates.push(startOfDay(cur));
    }
    updateData({ ...data, selectedDates: dates, frequency: freq, repeatCount: count });
  };

  const pickDate = (date: Date | undefined) => {
    if (!date || isBefore(date, startOfDay(new Date()))) return;
    if (recurring) {
      setStartDate(date);
      genRecurring(date, data.frequency as "daily" | "weekly" | "monthly");
      return;
    }
    const exists = data.selectedDates.some((d) => isSameDay(d, date));
    const next = exists
      ? data.selectedDates.filter((d) => !isSameDay(d, date))
      : [...data.selectedDates, startOfDay(date)].sort((a, b) => a.getTime() - b.getTime());
    updateData({ ...data, selectedDates: next });
  };

  const setFreq = (v: typeof data.frequency) => {
    updateData({ ...data, frequency: v, selectedDates: v === "custom" || v === "once" ? data.selectedDates : [], repeatCount: count });
    if (startDate && (v === "daily" || v === "weekly" || v === "monthly")) genRecurring(startDate, v);
  };

  const calCls = {
    months: "flex flex-col sm:flex-row",
    month: "w-full",
    table: "w-full border-collapse",
    day_selected: "bg-primary text-primary-foreground hover:bg-primary/90 focus:bg-primary/90 font-medium",
    day_today: "ring-1 ring-primary/50 text-primary font-medium",
    day_disabled: "text-slate-700 cursor-not-allowed hover:bg-transparent hover:scale-100",
    day: cn("relative h-10 w-10 rounded-xl p-0 font-normal text-sm text-slate-300 transition-all duration-150 hover:bg-white/[0.08] hover:text-white hover:scale-[1.08] cursor-pointer"),
    head_cell: "text-slate-500 text-[11px] font-medium w-10 pb-2",
    caption_label: "text-white text-sm font-semibold",
    caption: "flex justify-center pt-1 relative items-center pb-3",
    nav: "space-x-1 flex items-center",
    nav_button: "h-8 w-8 inline-flex items-center justify-center border border-white/[0.08] bg-white/[0.03] text-slate-300 hover:bg-white/[0.08] hover:text-white rounded-lg transition-colors",
    nav_button_previous: "absolute left-1",
    nav_button_next: "absolute right-1",
    cell: "text-center p-0.5",
    row: "flex w-full mt-0.5 justify-center",
    head_row: "flex w-full justify-center",
    day_outside: "text-slate-700 opacity-40",
  };

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Schedule</span>
        {data.selectedDates.length > 0 && (
          <span className="text-[11px] text-slate-400">
            {data.selectedDates.length} date{data.selectedDates.length > 1 ? "s" : ""} selected
          </span>
        )}
      </div>

      {/* Frequency tabs */}
      <div className="mb-4 inline-flex rounded-lg bg-white/[0.03] p-0.5">
        {FREQ.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFreq(f.value)}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200",
              data.frequency === f.value
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Controls row: recurring options + execution time */}
      <div className="mb-4 flex flex-wrap items-end gap-4">
        {recurring && (
          <>
            <div className="min-w-[140px] flex-1 space-y-1.5">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">Occurrences</span>
                <span className="font-medium text-white">{count}×</span>
              </div>
              <Slider
                value={[count]}
                min={2}
                max={24}
                step={1}
                onValueChange={(v) => updateData({ ...data, repeatCount: v[0] })}
              />
            </div>
            <div className="text-xs text-slate-500">
              From {startDate ? format(startDate, "MMM d, yyyy") : "—"}
            </div>
          </>
        )}

        {/* Execution time picker */}
        <div className="ml-auto flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-slate-500" />
          <Select
            value={String(data.executionHour)}
            onValueChange={(v) =>
              updateData({ ...data, executionHour: Number(v) })
            }
          >
            <SelectTrigger className="h-8 w-[72px] border-white/[0.08] bg-white/[0.03] text-xs text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-[#0a0a0a] text-white max-h-48">
              {HOURS.map((h) => (
                <SelectItem key={h} value={String(h)} className="text-xs">
                  {String(h).padStart(2, "0")}:00
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-slate-500">:</span>
          <Select
            value={String(data.executionMinute)}
            onValueChange={(v) =>
              updateData({ ...data, executionMinute: Number(v) })
            }
          >
            <SelectTrigger className="h-8 w-[72px] border-white/[0.08] bg-white/[0.03] text-xs text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-[#0a0a0a] text-white max-h-48">
              {MINUTES.map((m) => (
                <SelectItem key={m} value={String(m)} className="text-xs">
                  {String(m).padStart(2, "0")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={data.timezone || "UTC"}
            onValueChange={(v) => updateData({ ...data, timezone: v })}
          >
            <SelectTrigger className="h-8 w-[220px] border-white/[0.08] bg-white/[0.03] text-xs text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-[#0a0a0a] text-white max-h-56">
              {supportedTimezones.map((tz) => (
                <SelectItem key={tz} value={tz} className="text-xs">
                  {tz}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="flex justify-center rounded-xl border border-white/[0.05] bg-[#060608] p-3 sm:p-5">
        {recurring ? (
          <Calendar
            mode="single"
            selected={startDate}
            onSelect={(v: Date | undefined) => pickDate(v)}
            disabled={(d) => isBefore(d, startOfDay(new Date()))}
            className="w-full text-white"
            classNames={calCls}
          />
        ) : (
          <Calendar
            mode="multiple"
            selected={data.selectedDates}
            onSelect={(v: Date[] | undefined) => {
              const dates = (v ?? []).map((d) => startOfDay(d)).sort((a: Date, b: Date) => a.getTime() - b.getTime());
              updateData({ ...data, selectedDates: dates });
            }}
            disabled={(d) => isBefore(d, startOfDay(new Date()))}
            className="w-full text-white"
            classNames={calCls}
          />
        )}
      </div>

      {/* Selected dates chips + info */}
      {data.selectedDates.length > 0 && (
        <div className="mt-3 space-y-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {data.selectedDates.slice(0, 10).map((d, i) => (
              <motion.span
                key={d.toISOString()}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.025 }}
                className="inline-flex items-center gap-1 rounded-lg bg-primary/10 border border-primary/20 px-2 py-1 text-[11px] font-medium text-primary"
              >
                <CalendarIcon className="h-3 w-3" />
                {format(d, "MMM d")}
                <span className="text-primary/50">{format(d, "EEE")}</span>
              </motion.span>
            ))}
            {data.selectedDates.length > 10 && (
              <span className="text-[11px] text-slate-500">+{data.selectedDates.length - 10} more</span>
            )}

            <button
              type="button"
              onClick={() => updateData({ ...data, selectedDates: [], scheduleTimes: [] })}
              className="ml-auto flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-slate-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
            >
              <Trash2 className="h-3 w-3" /> Clear all
            </button>
          </div>

          {/* Execution info */}
          <div className="flex items-center gap-1.5 px-1 text-[11px] text-slate-500">
            <Info className="h-3 w-3" />
            Payments execute at{" "}
            {String(data.executionHour).padStart(2, "0")}:
            {String(data.executionMinute).padStart(2, "0")} {data.timezone} ·{" "}
            {data.frequency} schedule
          </div>
        </div>
      )}
    </div>
  );
}
