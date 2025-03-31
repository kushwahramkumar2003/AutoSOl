import { CalendarClock, MoreHorizontal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface Payment {
  id: string;
  recipient: string;
  amount: number;
  token: string;
  nextDate: string;
  frequency: "daily" | "weekly" | "monthly" | "custom";
}

interface UpcomingPaymentsProps {
  payments: Payment[];
  className?: string;
}

export default function UpcomingPayments({
  payments,
  className,
}: UpcomingPaymentsProps) {
  return (
    <Card className={cn("bg-dark-200 border-white/10 text-white", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">Upcoming Payments</CardTitle>
        <Button
          variant="outline"
          size="sm"
          className="h-8 border-white/10 bg-dark-300 hover:bg-white/10"
        >
          View All
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {payments.length > 0 ? (
            payments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-dark-300"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#6E56CF]/20 flex items-center justify-center">
                    <CalendarClock className="h-5 w-5 text-[#6E56CF]" />
                  </div>
                  <div>
                    <h4 className="font-medium">{payment.recipient}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-white/70">
                        {payment.amount} {payment.token}
                      </span>
                      <Badge className="capitalize bg-[#6E56CF]/20 text-[#6E56CF] hover:bg-[#6E56CF]/30">
                        {payment.frequency}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm font-medium">Next payment</div>
                    <div className="text-sm text-white/70">
                      {payment.nextDate}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="bg-dark-200 border-white/10 text-white"
                    >
                      <DropdownMenuItem className="hover:bg-white/10 focus:bg-white/10 cursor-pointer">
                        Edit Payment
                      </DropdownMenuItem>
                      <DropdownMenuItem className="hover:bg-white/10 focus:bg-white/10 cursor-pointer">
                        Skip Next Payment
                      </DropdownMenuItem>
                      <DropdownMenuItem className="hover:bg-white/10 focus:bg-white/10 cursor-pointer text-red-500">
                        Cancel Payment
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-white/50">
              No upcoming payments
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
