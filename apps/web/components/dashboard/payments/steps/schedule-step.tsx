"use client";

import { useState, useEffect } from "react";
import {
  format,
  addDays,
  addWeeks,
  addMonths,
  isSameDay,
  isBefore,
  isAfter,
  startOfDay,
} from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  CalendarIcon,
  Trash2,
  CalendarDays,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Info,
  Repeat,
  Clock,
  CalendarIcon as CalendarSquare,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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

export default function ScheduleStep({ data, updateData }: ScheduleStepProps) {
  const [scheduleType, setScheduleType] = useState<"recurring" | "specific">(
    data.frequency === "custom" || data.frequency === "once"
      ? "specific"
      : "recurring"
  );
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    data.selectedDates.length > 0 ? data.selectedDates[0] : undefined
  );
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);

  //eslint-disable-next-line
  const [highlightedDate, setHighlightedDate] = useState<Date | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipContent, setTooltipContent] = useState("");
  const [repeatCount, setRepeatCount] = useState(data.repeatCount || 12);
  const [showAllDates, setShowAllDates] = useState(false);
  const [calendarView, setCalendarView] = useState<"month" | "year">("month");
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);

  // Convert dates to Unix timestamps
  useEffect(() => {
    const timestamps = data.selectedDates.map((date) =>
      Math.floor(date.getTime() / 1000)
    );
    updateData({
      ...data,
      scheduleTimes: timestamps,
    });
  }, [data.selectedDates]);

  // Auto-switch tabs when frequency changes
  useEffect(() => {
    if (data.frequency === "custom" || data.frequency === "once") {
      setScheduleType("specific");
    } else if (["daily", "weekly", "monthly"].includes(data.frequency)) {
      setScheduleType("recurring");
    }
  }, [data.frequency]);

  // Update repeat count in parent data
  useEffect(() => {
    if (data.frequency !== "once" && data.frequency !== "custom") {
      updateData({
        ...data,
        repeatCount: repeatCount,
      });
    }
  }, [repeatCount]);

  // Regenerate dates when repeat count changes
  useEffect(() => {
    if (
      selectedDate &&
      data.frequency !== "once" &&
      data.frequency !== "custom"
    ) {
      generateRecurringDates(selectedDate, data.frequency, data.endDate);
    }
  }, [repeatCount]);

  const handleDateSelect = (date: Date | Date[] | undefined) => {
    if (!date) return;

    setShowTooltip(true);

    // Handle multiple dates selection for Calendar with mode="multiple"
    if (Array.isArray(date)) {
      updateData({
        ...data,
        selectedDates: date.sort((a, b) => a.getTime() - b.getTime()),
      });
      setTooltipContent("Dates updated");
    } else if (scheduleType === "specific") {
      const isSelected = data.selectedDates.some((d) => isSameDay(d, date));
      if (isSelected) {
        setTooltipContent("Date removed");
        updateData({
          ...data,
          selectedDates: data.selectedDates.filter((d) => !isSameDay(d, date)),
        });
      } else {
        setTooltipContent("Date added");
        updateData({
          ...data,
          selectedDates: [...data.selectedDates, startOfDay(date)].sort(
            (a, b) => a.getTime() - b.getTime()
          ),
        });
      }
    } else {
      setSelectedDate(date);
      setTooltipContent("Schedule updated");
      generateRecurringDates(date, data.frequency, data.endDate);
    }

    setTimeout(() => {
      setShowTooltip(false);
    }, 1500);
  };

  const handleFrequencyChange = (
    frequency: "once" | "daily" | "weekly" | "monthly" | "custom"
  ) => {
    updateData({
      ...data,
      frequency,
      selectedDates: frequency === "custom" ? [] : data.selectedDates,
    });

    if (selectedDate && frequency !== "custom") {
      generateRecurringDates(selectedDate, frequency, data.endDate);
    }

    if (frequency === "custom" || frequency === "once") {
      setScheduleType("specific");
    }
  };

  const handleEndDateChange = (endDate: Date | undefined) => {
    updateData({
      ...data,
      endDate,
    });

    if (selectedDate && endDate) {
      generateRecurringDates(selectedDate, data.frequency, endDate);
    }
  };

  const handleRepeatCountChange = (value: number[]) => {
    setRepeatCount(value[0]);
  };

  const generateRecurringDates = (
    startDate: Date,
    frequency: string,
    endDate?: Date
  ) => {
    if (!startDate) return;

    const dates: Date[] = [];
    let currentDate = startDate;

    dates.push(startOfDay(currentDate));

    // Use repeatCount instead of hardcoded maxDates
    const maxDates = repeatCount || 12;

    while (dates.length < maxDates) {
      let nextDate: Date;

      switch (frequency) {
        case "daily":
          nextDate = addDays(currentDate, 1);
          break;
        case "weekly":
          nextDate = addWeeks(currentDate, 1);
          break;
        case "monthly":
          nextDate = addMonths(currentDate, 1);
          break;
        default:
          updateData({
            ...data,
            selectedDates: [startOfDay(startDate)],
          });
          return;
      }

      if (endDate && isAfter(nextDate, endDate)) {
        break;
      }

      dates.push(startOfDay(nextDate));
      currentDate = nextDate;
    }

    updateData({
      ...data,
      selectedDates: dates,
    });
  };

  const clearSelectedDates = () => {
    if (isConfirmingClear) {
      updateData({
        ...data,
        selectedDates: [],
      });
      setIsConfirmingClear(false);
    } else {
      setIsConfirmingClear(true);
      setTimeout(() => setIsConfirmingClear(false), 3000);
    }
  };

  const highlightDate = (date: Date) => {
    setHighlightedDate(date);
  };

  const clearHighlight = () => {
    setHighlightedDate(null);
  };

  const getScheduleDescription = () => {
    if (data.selectedDates.length === 0) return "No schedule set";
    if (data.selectedDates.length === 1) return "One-time payment";

    switch (data.frequency) {
      case "daily":
        return `Daily payments (${data.selectedDates.length} total)`;
      case "weekly":
        return `Weekly payments (${data.selectedDates.length} total)`;
      case "monthly":
        return `Monthly payments (${data.selectedDates.length} total)`;
      default:
        return `${data.selectedDates.length} scheduled payments`;
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        when: "beforeChildren",
        staggerChildren: 0.1,
      },
    },
  };

  const listItemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.05, duration: 0.3 },
    }),
    removed: { opacity: 0, x: -20 },
  };

  const badgeVariants = {
    initial: { scale: 0.8, opacity: 0 },
    animate: {
      scale: 1,
      opacity: 1,
      transition: { type: "spring", stiffness: 500 },
    },
  };

  const tooltipVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
    exit: { opacity: 0, transition: { duration: 0.2 } },
  };

  const calendarItemClass = (date: Date) => {
    const isSelected = data.selectedDates.some((d) => isSameDay(d, date));
    const isHovered = hoveredDate && isSameDay(hoveredDate, date);

    return cn(
      "relative flex h-10 w-10 items-center justify-center rounded-full p-0 text-sm transition-colors",
      isSelected &&
        "bg-gradient-to-br from-[#6E56CF] to-[#9333ea] text-white font-medium shadow-lg",
      !isSelected && "hover:bg-[#6E56CF]/20",
      isHovered && !isSelected && "bg-[#6E56CF]/10 ring-1 ring-[#6E56CF]/30",
      isBefore(date, new Date()) &&
        !isSelected &&
        "text-white/30 hover:bg-white/5 cursor-not-allowed"
    );
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 w-full max-w-7xl mx-auto"
    >
      <motion.div variants={containerVariants}>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-[#6E56CF] to-[#9333ea] bg-clip-text text-transparent">
          Payment Schedule
        </h2>
        <p className="text-white/70 mt-2">
          Plan your payment timeline with precision
        </p>
      </motion.div>

      <Tabs
        value={scheduleType}
        onValueChange={(value) =>
          setScheduleType(value as "recurring" | "specific")
        }
        className="w-full"
      >
        <motion.div variants={containerVariants}>
          <TabsList className="grid grid-cols-2  border border-white/10 w-full mb-6 rounded-xl p-1 h-auto">
            <TabsTrigger
              value="specific"
              className="relative py-3 text-sm font-medium rounded-lg transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#6E56CF] data-[state=active]:to-[#9333ea] data-[state=active]:text-white data-[state=inactive]:hover:bg-white/5"
            >
              <motion.span
                layout
                className="relative z-10 flex items-center justify-center"
              >
                <CalendarIcon className="w-4 h-4 mr-2" />
                Specific Dates
              </motion.span>
              {scheduleType === "specific" && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute inset-0 bg-gradient-to-r from-[#6E56CF] to-[#9333ea] rounded-lg"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </TabsTrigger>
            <TabsTrigger
              value="recurring"
              className="relative py-3 text-sm font-medium rounded-lg transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#6E56CF] data-[state=active]:to-[#9333ea] data-[state=active]:text-white data-[state=inactive]:hover:bg-white/5"
            >
              <motion.span
                layout
                className="relative z-10 flex items-center justify-center"
              >
                <CalendarDays className="w-4 h-4 mr-2" />
                Recurring Schedule
              </motion.span>
              {scheduleType === "recurring" && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute inset-0 bg-gradient-to-r from-[#6E56CF] to-[#9333ea] rounded-lg"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </TabsTrigger>
          </TabsList>
        </motion.div>

        <AnimatePresence mode="wait">
          <TabsContent value="specific" className="w-full">
            <motion.div
              key="specific"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div variants={containerVariants} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-lg font-semibold text-white/80">
                      Select Payment Dates
                    </Label>
                    <div className="flex items-center gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 border-white/10  hover:bg-white/10"
                              onClick={() =>
                                setCalendarView(
                                  calendarView === "month" ? "year" : "month"
                                )
                              }
                            >
                              {calendarView === "month" ? (
                                <CalendarSquare className="h-4 w-4 mr-1" />
                              ) : (
                                <CalendarDays className="h-4 w-4 mr-1" />
                              )}
                              {calendarView === "month"
                                ? "Year View"
                                : "Month View"}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Switch calendar view</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                  <Card className="relative overflow-hidden  border border-white/10 shadow-xl">
                    <CardContent className="p-0">
                      <div className="p-4 bg-gradient-to-r from-[#6E56CF]/20 to-[#9333ea]/20 border-b border-white/10">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-white">
                            {calendarView === "month"
                              ? "Monthly Calendar"
                              : "Yearly Calendar"}
                          </h3>
                          <Badge className="bg-[#6E56CF]">
                            {data.selectedDates.length} selected
                          </Badge>
                        </div>
                      </div>
                      <div className="p-4">
                        <Calendar
                          mode="multiple"
                          selected={data.selectedDates}
                          onSelect={handleDateSelect}
                          disabled={(date) => isBefore(date, new Date())}
                          className="w-full bg-transparent text-white"
                          onDayMouseEnter={(date) => setHoveredDate(date)}
                          onDayMouseLeave={() => setHoveredDate(null)}
                          classNames={{
                            day_selected:
                              "!bg-none text-white hover:!bg-[#6E56CF]/80 transition-colors",
                            day_today:
                              "text-white ring-1 ring-[#6E56CF]/50 gap-2",
                            // @ts-expect-error - Tailwind classes
                            day: calendarItemClass,
                            head_cell: "text-white/60 font-medium",
                            caption:
                              "flex justify-center pt-1 relative items-center",
                            caption_label: "text-base font-semibold text-white",
                            nav_button:
                              "border border-white/10 hover:bg-white/10 rounded-md p-1",
                            table: "w-full border-collapse space-y-1",
                            cell: "relative p-0 text-center gap-2",
                            row: "flex w-full mt-2",
                            head_row: "flex",
                            months: "flex flex-wrap gap-2",
                            month: "space-y-4 p-3 gap-2",
                          }}
                          views={["day", "month"]}
                          view={calendarView === "month" ? "day" : "month"}
                        />
                      </div>
                    </CardContent>
                    <AnimatePresence>
                      {showTooltip && (
                        <motion.div
                          variants={tooltipVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-[#6E56CF] to-[#9333ea] text-white px-3 py-1 rounded-md text-sm flex items-center shadow-lg"
                        >
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          {tooltipContent}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </motion.div>

                <motion.div variants={containerVariants} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-lg font-semibold text-white/80">
                      Selected Dates
                    </Label>
                    <motion.div
                      variants={badgeVariants}
                      initial="initial"
                      animate="animate"
                    >
                      <Badge className="bg-gradient-to-r from-[#6E56CF] to-[#9333ea] animate-pulse">
                        {data.selectedDates.length} selected
                      </Badge>
                    </motion.div>
                  </div>
                  <Card className="border border-white/10 shadow-xl">
                    <CardContent className="p-0">
                      <div className="p-4 bg-gradient-to-r from-[#6E56CF]/20 to-[#9333ea]/20 border-b border-white/10">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-white">
                            Payment Schedule
                          </h3>
                          {data.selectedDates.length > 5 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowAllDates(!showAllDates)}
                              className="text-white/70 hover:text-white hover:bg-white/10"
                            >
                              {showAllDates ? (
                                <>
                                  <ChevronUp className="h-3 w-3 mr-1" />
                                  Show Less
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="h-3 w-3 mr-1" />
                                  Show All
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="min-h-[300px] max-h-[400px] overflow-y-auto">
                        <AnimatePresence>
                          {data.selectedDates.length > 0 ? (
                            (showAllDates
                              ? data.selectedDates
                              : data.selectedDates.slice(0, 5)
                            ).map((date, index) => (
                              <motion.div
                                key={date.toISOString()}
                                custom={index}
                                variants={listItemVariants}
                                initial="hidden"
                                animate="visible"
                                exit="removed"
                                className="flex items-center justify-between py-3 px-4 border-b border-white/5 hover:bg-white/5 transition-colors"
                                onMouseEnter={() => highlightDate(date)}
                                onMouseLeave={clearHighlight}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6E56CF]/20 to-[#9333ea]/20 flex items-center justify-center">
                                    <CalendarIcon className="h-5 w-5 text-[#6E56CF]" />
                                  </div>
                                  <div>
                                    <p className="font-medium">
                                      {format(date, "MMMM d, yyyy")}
                                    </p>
                                    <p className="text-xs text-white/60">
                                      <Clock className="inline h-3 w-3 mr-1" />
                                      {format(date, "EEEE")}
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-full hover:bg-red-500/20 hover:text-red-400 transition-colors"
                                  onClick={() => handleDateSelect(date)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </motion.div>
                            ))
                          ) : (
                            <motion.div
                              variants={listItemVariants}
                              className="text-center py-12 text-white/50"
                            >
                              <div className="w-16 h-16 rounded-full  mx-auto mb-4 flex items-center justify-center">
                                <CalendarIcon className="h-8 w-8 opacity-50" />
                              </div>
                              <p className="text-lg">No dates selected yet</p>
                              <p className="text-sm mt-2 max-w-xs mx-auto">
                                Click dates on the calendar to add them to your
                                payment schedule
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        {!showAllDates && data.selectedDates.length > 5 && (
                          <div className="p-4 text-center border-t border-white/5">
                            <Button
                              variant="ghost"
                              onClick={() => setShowAllDates(true)}
                              className="text-[#6E56CF] hover:text-[#9333ea] hover:bg-[#6E56CF]/10"
                            >
                              <ChevronDown className="h-4 w-4 mr-2" />
                              Show {data.selectedDates.length - 5} more dates
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="border-t border-white/10 p-4">
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full border-white/10  hover:bg-red-500/10 hover:text-red-400 transition-colors",
                          isConfirmingClear &&
                            "bg-red-500/20 border-red-500/50 text-red-400"
                        )}
                        onClick={clearSelectedDates}
                        disabled={data.selectedDates.length === 0}
                      >
                        {isConfirmingClear ? (
                          <>
                            <AlertCircle className="h-4 w-4 mr-2" />
                            Confirm Clear All
                          </>
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Clear All Dates
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="recurring" className="w-full">
            <motion.div
              key="recurring"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div variants={containerVariants} className="space-y-6">
                  <Card className=" border border-white/10 shadow-xl">
                    <CardHeader className="bg-gradient-to-r from-[#6E56CF]/20 to-[#9333ea]/20 border-b border-white/10">
                      <CardTitle className="text-lg">
                        Recurring Settings
                      </CardTitle>
                      <CardDescription>
                        Configure your payment schedule
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                      <div className="space-y-4">
                        <Label className="text-base font-semibold text-white/80">
                          Payment Frequency
                        </Label>
                        <Select
                          value={data.frequency}
                          //eslint-disable-next-line
                          onValueChange={(value: any) =>
                            handleFrequencyChange(value)
                          }
                        >
                          <SelectTrigger className="w-full  border-white/10 focus:ring-[#6E56CF] rounded-xl py-6">
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                          <SelectContent className=" border-white/10 text-white rounded-xl">
                            {[
                              { value: "once", label: "One-time Payment" },
                              { value: "daily", label: "Daily" },
                              { value: "weekly", label: "Weekly" },
                              { value: "monthly", label: "Monthly" },
                              { value: "custom", label: "Custom Schedule" },
                            ].map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                                className="py-3"
                              >
                                <div className="flex items-center">
                                  {option.value === "once" && (
                                    <CalendarIcon className="h-4 w-4 mr-2" />
                                  )}
                                  {option.value === "daily" && (
                                    <Clock className="h-4 w-4 mr-2" />
                                  )}
                                  {option.value === "weekly" && (
                                    <CalendarDays className="h-4 w-4 mr-2" />
                                  )}
                                  {option.value === "monthly" && (
                                    <CalendarSquare className="h-4 w-4 mr-2" />
                                  )}
                                  {option.value === "custom" && (
                                    <Repeat className="h-4 w-4 mr-2" />
                                  )}
                                  {option.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-4">
                          <Label className="text-base font-semibold text-white/80">
                            Start Date
                          </Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-left py-6 rounded-xl border-white/10  hover:bg-white/10 transition-colors"
                              >
                                <CalendarIcon className="mr-3 h-5 w-5" />
                                {selectedDate
                                  ? format(selectedDate, "MMMM d, yyyy")
                                  : "Select date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0  border-white/10 rounded-xl">
                              <div className="p-3 border-b border-white/10 bg-gradient-to-r from-[#6E56CF]/20 to-[#9333ea]/20">
                                <h3 className="text-base font-semibold text-white">
                                  Select Start Date
                                </h3>
                              </div>
                              <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={handleDateSelect}
                                disabled={(date) => isBefore(date, new Date())}
                                className="w-full  text-white rounded-xl"
                                classNames={{
                                  day_selected:
                                    "bg-gradient-to-br from-[#6E56CF] to-[#9333ea] text-white hover:bg-[#5a46b0]",
                                  day_today:
                                    "text-white ring-1 ring-[#6E56CF]/50",
                                  day: "hover:bg-white/10 rounded-full",
                                }}
                              />
                              <AnimatePresence>
                                {showTooltip && (
                                  <motion.div
                                    variants={tooltipVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    className="bg-gradient-to-r from-[#6E56CF] to-[#9333ea] text-white px-3 py-1 rounded-md text-sm flex items-center m-2"
                                  >
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    {tooltipContent}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </PopoverContent>
                          </Popover>
                        </div>

                        {data.frequency !== "once" && (
                          <div className="space-y-4">
                            <Label className="text-base font-semibold text-white/80">
                              End Date (Optional)
                            </Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="w-full justify-start text-left py-6 rounded-xl border-white/10  hover:bg-white/10 transition-colors"
                                >
                                  <CalendarIcon className="mr-3 h-5 w-5" />
                                  {data.endDate
                                    ? format(data.endDate, "MMMM d, yyyy")
                                    : "No end date"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0  border-white/10 rounded-xl">
                                <div className="p-3 border-b border-white/10 bg-gradient-to-r from-[#6E56CF]/20 to-[#9333ea]/20">
                                  <h3 className="text-base font-semibold text-white">
                                    Select End Date
                                  </h3>
                                </div>
                                <Calendar
                                  mode="single"
                                  selected={data.endDate}
                                  onSelect={handleEndDateChange}
                                  disabled={(date) =>
                                    isBefore(date, selectedDate || new Date())
                                  }
                                  className="w-full  text-white rounded-xl"
                                  classNames={{
                                    day_selected:
                                      "bg-gradient-to-br from-[#6E56CF] to-[#9333ea] text-white hover:bg-[#5a46b0]",
                                    day_today:
                                      " text-white ring-1 ring-[#6E56CF]/50",
                                    day: "hover:bg-white/10 rounded-full",
                                  }}
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                        )}
                      </div>

                      {/* New repeat count slider */}
                      {data.frequency !== "once" &&
                        data.frequency !== "custom" && (
                          <div className="space-y-4 pt-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-base font-semibold text-white/80">
                                Number of Payments
                              </Label>
                              <Badge className="bg-gradient-to-r from-[#6E56CF] to-[#9333ea]">
                                {repeatCount}
                              </Badge>
                            </div>
                            <div className="px-2">
                              <Slider
                                defaultValue={[repeatCount]}
                                max={52}
                                min={1}
                                step={1}
                                onValueChange={handleRepeatCountChange}
                                className="py-4"
                              />
                              <div className="flex justify-between text-xs text-white/60 mt-1">
                                <span>1</span>
                                <span>26</span>
                                <span>52</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-white/70">
                              <Info className="h-4 w-4 text-[#6E56CF]" />
                              <span>
                                {data.frequency === "daily" &&
                                  "Daily payments for"}
                                {data.frequency === "weekly" &&
                                  "Weekly payments for"}
                                {data.frequency === "monthly" &&
                                  "Monthly payments for"}{" "}
                                {repeatCount}{" "}
                                {repeatCount === 1
                                  ? data.frequency === "daily"
                                    ? "day"
                                    : data.frequency === "weekly"
                                      ? "week"
                                      : "month"
                                  : data.frequency === "daily"
                                    ? "days"
                                    : data.frequency === "weekly"
                                      ? "weeks"
                                      : "months"}
                              </span>
                            </div>
                          </div>
                        )}
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div variants={containerVariants} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-lg font-semibold text-white/80">
                      Generated Schedule
                    </Label>
                    <motion.div
                      variants={badgeVariants}
                      initial="initial"
                      animate="animate"
                    >
                      <Badge className="bg-gradient-to-r from-[#6E56CF] to-[#9333ea] animate-pulse">
                        {data.selectedDates.length} payments
                      </Badge>
                    </motion.div>
                  </div>
                  <Card className=" border border-white/10 shadow-xl">
                    <CardHeader className="bg-gradient-to-r from-[#6E56CF]/20 to-[#9333ea]/20 border-b border-white/10">
                      <CardTitle className="text-lg">
                        Payment Timeline
                      </CardTitle>
                      <CardDescription>
                        {getScheduleDescription()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="min-h-[300px] max-h-[400px] overflow-y-auto">
                        <AnimatePresence>
                          {data.selectedDates.length > 0 ? (
                            (showAllDates
                              ? data.selectedDates
                              : data.selectedDates.slice(0, 10)
                            ).map((date, index) => (
                              <motion.div
                                key={date.toISOString()}
                                custom={index}
                                variants={listItemVariants}
                                initial="hidden"
                                animate="visible"
                                exit="removed"
                                className="flex items-center justify-between py-3 px-4 border-b border-white/5 hover:bg-white/5 transition-colors"
                                onMouseEnter={() => highlightDate(date)}
                                onMouseLeave={clearHighlight}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6E56CF]/20 to-[#9333ea]/20 flex items-center justify-center">
                                    <CalendarDays className="h-5 w-5 text-[#6E56CF]" />
                                  </div>
                                  <div>
                                    <p className="font-medium">
                                      {format(date, "MMMM d, yyyy")}
                                    </p>
                                    <p className="text-xs text-white/60">
                                      <Clock className="inline h-3 w-3 mr-1" />
                                      {format(date, "EEEE")}
                                    </p>
                                  </div>
                                </div>
                                <Badge className="bg-gradient-to-r from-[#6E56CF]/80 to-[#9333ea]/80 text-white">
                                  {index === 0 ? "First" : `#${index + 1}`}
                                </Badge>
                              </motion.div>
                            ))
                          ) : (
                            <motion.div
                              variants={listItemVariants}
                              className="text-center py-12 text-white/50"
                            >
                              <div className="w-16 h-16 rounded-full  mx-auto mb-4 flex items-center justify-center">
                                <CalendarDays className="h-8 w-8 opacity-50" />
                              </div>
                              <p className="text-lg">No schedule generated</p>
                              <p className="text-sm mt-2 max-w-xs mx-auto">
                                Set a start date and frequency to generate your
                                payment schedule
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        {!showAllDates && data.selectedDates.length > 10 && (
                          <div className="p-4 text-center border-t border-white/5">
                            <Button
                              variant="ghost"
                              onClick={() => setShowAllDates(true)}
                              className="text-[#6E56CF] hover:text-[#9333ea] hover:bg-[#6E56CF]/10"
                            >
                              <ChevronDown className="h-4 w-4 mr-2" />
                              Show {data.selectedDates.length - 10} more
                              payments
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="border-t border-white/10 p-4">
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full border-white/10  hover:bg-red-500/10 hover:text-red-400 transition-colors",
                          isConfirmingClear &&
                            "bg-red-500/20 border-red-500/50 text-red-400"
                        )}
                        onClick={clearSelectedDates}
                        disabled={data.selectedDates.length === 0}
                      >
                        {isConfirmingClear ? (
                          <>
                            <AlertCircle className="h-4 w-4 mr-2" />
                            Confirm Clear Schedule
                          </>
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Clear Schedule
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              </div>

              {data.frequency === "custom" && (
                <motion.div
                  variants={containerVariants}
                  className="p-6 rounded-xl  border border-white/10 shadow-xl"
                >
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <Info className="h-5 w-5 mr-2 text-[#6E56CF]" />
                    Custom Schedule
                  </h3>
                  <p className="text-white/70 mb-4">
                    For custom schedules, switch to specific dates mode to
                    select individual payment dates.
                  </p>
                  <Button
                    variant="outline"
                    className="border-white/10 hover:bg-[#6E56CF]/20 hover:border-[#6E56CF] transition-colors flex items-center"
                    onClick={() => setScheduleType("specific")}
                  >
                    Switch to Specific Dates
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </motion.div>
              )}
            </motion.div>
          </TabsContent>
        </AnimatePresence>
      </Tabs>

      <motion.div
        variants={containerVariants}
        className="p-6 rounded-xl bg-gradient-to-r from-[#6E56CF]/10 to-[#9333ea]/10 border border-white/10 shadow-xl"
      >
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Info className="h-5 w-5 mr-2 text-[#6E56CF]" />
          Schedule Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="space-y-2">
            <span className="text-white/70">Total Payments</span>
            <p className="text-2xl font-bold bg-gradient-to-r from-[#6E56CF] to-[#9333ea] bg-clip-text text-transparent">
              {data.selectedDates.length}
            </p>
          </div>
          <div className="space-y-2">
            <span className="text-white/70">First Payment</span>
            <p className="text-2xl font-bold bg-gradient-to-r from-[#6E56CF] to-[#9333ea] bg-clip-text text-transparent">
              {data.selectedDates.length > 0
                ? format(data.selectedDates[0], "MMM d, yyyy")
                : "Not set"}
            </p>
          </div>
          <div className="space-y-2">
            <span className="text-white/70">Last Payment</span>
            <p className="text-2xl font-bold bg-gradient-to-r from-[#6E56CF] to-[#9333ea] bg-clip-text text-transparent">
              {data.selectedDates.length > 0
                ? format(
                    data.selectedDates[data.selectedDates.length - 1],
                    "MMM d, yyyy"
                  )
                : "Not set"}
            </p>
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-4 p-3 rounded-lg border border-white/10"
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              <CalendarDays className="h-5 w-5 text-[#6E56CF]" />
            </div>
            <div>
              <p className="text-white/70">
                {getScheduleDescription()}
                {data.frequency !== "once" &&
                  data.frequency !== "custom" &&
                  data.selectedDates.length > 0 && (
                    <>
                      {" "}
                      starting on{" "}
                      <span className="text-white font-medium">
                        {format(data.selectedDates[0], "MMMM d, yyyy")}
                      </span>
                    </>
                  )}
                {data.endDate && (
                  <>
                    {" "}
                    and ending on{" "}
                    <span className="text-white font-medium">
                      {format(data.endDate, "MMMM d, yyyy")}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
