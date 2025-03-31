"use client";

import { useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
} from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Payment {
  id: string;
  recipient: string;
  amount: number;
  token: string;
  date: Date;
  status: "pending" | "completed" | "failed";
}

interface CalendarViewProps {
  payments: Payment[];
  onDateSelect: (date: Date) => void;
  onAddPayment: () => void;
}

export default function CalendarView({
  payments,
  onDateSelect,
  onAddPayment,
}: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const getPaymentsForDay = (day: Date) => {
    return payments.filter((payment) => isSameDay(payment.date, day));
  };

  return (
    <Card className="bg-dark-200 border-white/10 text-white">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">Payment Calendar</CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 border-white/10 bg-dark-300 hover:bg-white/10"
            onClick={prevMonth}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-lg font-medium">
            {format(currentMonth, "MMMM yyyy")}
          </h3>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 border-white/10 bg-dark-300 hover:bg-white/10"
            onClick={nextMonth}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button
          className="bg-gradient-to-r from-[#6E56CF] to-[#10B981] hover:from-[#5a46b0] hover:to-[#0e9d6d] text-white shadow-neon"
          onClick={onAddPayment}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Payment
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="text-center text-white/70 text-sm py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: monthStart.getDay() }).map((_, index) => (
            <div
              key={`empty-start-${index}`}
              className="h-24 p-1 bg-dark-300/50 rounded-md"
            ></div>
          ))}

          {monthDays.map((day) => {
            const dayPayments = getPaymentsForDay(day);
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={day.toString()}
                className={cn(
                  "h-24 p-1 bg-dark-300 rounded-md border border-transparent transition-colors overflow-hidden",
                  isToday ? "border-[#6E56CF]" : "hover:border-white/20",
                  dayPayments.length > 0 ? "cursor-pointer" : ""
                )}
                onClick={() => onDateSelect(day)}
              >
                <div className="flex justify-between items-start">
                  <span
                    className={cn(
                      "text-sm font-medium h-6 w-6 flex items-center justify-center rounded-full",
                      isToday ? "bg-[#6E56CF] text-white" : "text-white/70"
                    )}
                  >
                    {format(day, "d")}
                  </span>
                  {dayPayments.length > 0 && (
                    <Badge className="bg-[#6E56CF]">{dayPayments.length}</Badge>
                  )}
                </div>

                <div className="mt-1 space-y-1">
                  {dayPayments.slice(0, 2).map((payment, index) => (
                    <div
                      key={payment.id}
                      className={cn(
                        "text-xs p-1 rounded truncate",
                        payment.status === "completed"
                          ? "bg-[#10B981]/20 text-[#10B981]"
                          : payment.status === "pending"
                            ? "bg-yellow-500/20 text-yellow-500"
                            : "bg-red-500/20 text-red-500"
                      )}
                    >
                      {payment.amount} {payment.token}
                    </div>
                  ))}
                  {dayPayments.length > 2 && (
                    <div className="text-xs text-white/50 pl-1">
                      +{dayPayments.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {Array.from({ length: 6 - monthEnd.getDay() }).map((_, index) => (
            <div
              key={`empty-end-${index}`}
              className="h-24 p-1 bg-dark-300/50 rounded-md"
            ></div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
