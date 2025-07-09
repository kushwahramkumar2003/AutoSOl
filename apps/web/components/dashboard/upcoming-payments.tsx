import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Clock,
  AlertTriangle,
  XCircle,
  Eye,
  Edit,
  Search,
  CalendarDays,
} from "lucide-react";
import { UpcomingPayment } from "@/hooks/use-dashboard-data";
import { cn } from "@/lib/utils";

interface UpcomingPaymentsProps {
  payments: UpcomingPayment[];
  className?: string;
  maxItems?: number;
  showFilters?: boolean;
  onViewAll?: () => void;
  onPaymentClick?: (payment: UpcomingPayment) => void;
  onEditPayment?: (payment: UpcomingPayment) => void;
  onCancelPayment?: (payment: UpcomingPayment) => void;
}

export function UpcomingPayments({
  payments,
  className,
  maxItems = 5,
  showFilters = true,
  onViewAll,
  onPaymentClick,
  onEditPayment,
  onCancelPayment,
}: UpcomingPaymentsProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [frequencyFilter, setFrequencyFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date");

  const filteredPayments = useMemo(() => {
    return payments
      .filter((payment) => {
        const matchesSearch =
          payment.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
          payment.token.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesFrequency =
          frequencyFilter === "all" || payment.frequency === frequencyFilter;

        return matchesSearch && matchesFrequency;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "date":
            return (
              new Date(a.nextDate).getTime() - new Date(b.nextDate).getTime()
            );
          case "amount":
            return b.amount - a.amount;
          case "recipient":
            return a.recipient.localeCompare(b.recipient);
          default:
            return 0;
        }
      })
      .slice(0, maxItems);
  }, [payments, searchTerm, frequencyFilter, sortBy, maxItems]);

  const getFrequencyColor = (frequency: string) => {
    switch (frequency.toLowerCase()) {
      case "daily":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "weekly":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "monthly":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case "yearly":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getDaysUntilPayment = (date: string) => {
    const paymentDate = new Date(date);
    const today = new Date();
    const diffTime = paymentDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: "Overdue", color: "text-red-600" };
    if (diffDays === 0) return { text: "Today", color: "text-orange-600" };
    if (diffDays === 1) return { text: "Tomorrow", color: "text-yellow-600" };
    if (diffDays <= 7)
      return { text: `${diffDays} days`, color: "text-blue-600" };
    return { text: `${diffDays} days`, color: "text-muted-foreground" };
  };

  const getUrgencyIcon = (date: string) => {
    const daysUntil = getDaysUntilPayment(date);
    if (daysUntil.text === "Overdue")
      return <AlertTriangle className="h-4 w-4 text-red-600" />;
    if (daysUntil.text === "Today")
      return <Clock className="h-4 w-4 text-orange-600" />;
    if (daysUntil.text === "Tomorrow")
      return <Clock className="h-4 w-4 text-yellow-600" />;
    return <CalendarDays className="h-4 w-4 text-muted-foreground" />;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Card
      className={cn("transition-all duration-200 hover:shadow-md", className)}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">
              Upcoming Payments
            </CardTitle>
            <CardDescription>
              Scheduled payments for the next 30 days
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            {onViewAll && (
              <Button variant="outline" size="sm" onClick={onViewAll}>
                View All
              </Button>
            )}
            <Button variant="outline" size="sm">
              <Calendar className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {showFilters && (
          <div className="flex items-center space-x-2 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search payments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={frequencyFilter} onValueChange={setFrequencyFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Frequency</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Sort by Date</SelectItem>
                <SelectItem value="amount">Sort by Amount</SelectItem>
                <SelectItem value="recipient">Sort by Recipient</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {filteredPayments.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground mb-2">No upcoming payments</p>
              <p className="text-sm text-muted-foreground">
                {searchTerm || frequencyFilter !== "all"
                  ? "Try adjusting your filters"
                  : "No scheduled payments for the next 30 days"}
              </p>
            </div>
          ) : (
            filteredPayments.map((payment) => {
              const daysUntil = getDaysUntilPayment(payment.nextDate);

              return (
                <div
                  key={payment.id}
                  className={cn(
                    "flex items-center justify-between p-4 border rounded-lg transition-all duration-200 hover:bg-muted/50",
                    daysUntil.text === "Overdue" &&
                      "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950"
                  )}
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <div
                      className={cn(
                        "p-2 rounded-full",
                        daysUntil.text === "Overdue"
                          ? "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400"
                          : "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400"
                      )}
                    >
                      {getUrgencyIcon(payment.nextDate)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="font-medium truncate">
                          {payment.recipient}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {payment.token}
                        </Badge>
                        <Badge
                          className={cn(
                            "text-xs",
                            getFrequencyColor(payment.frequency)
                          )}
                        >
                          {payment.frequency}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <p className="text-sm text-muted-foreground">
                          {formatDate(payment.nextDate)}
                        </p>
                        <span className="text-xs text-muted-foreground">•</span>
                        <p
                          className={cn("text-xs font-medium", daysUntil.color)}
                        >
                          {daysUntil.text}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <div className="font-medium">
                        {payment.amount.toFixed(4)} {payment.token}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Schedule: {payment.scheduleAddress.slice(0, 8)}...
                      </p>
                    </div>

                    <div className="flex items-center space-x-1">
                      {onPaymentClick && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onPaymentClick(payment)}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      {onEditPayment && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditPayment(payment)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {onCancelPayment && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onCancelPayment(payment)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {filteredPayments.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Showing {filteredPayments.length} of {payments.length} upcoming
                payments
              </span>
              {filteredPayments.length === maxItems && (
                <Button variant="link" size="sm" onClick={onViewAll}>
                  View All Payments
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
