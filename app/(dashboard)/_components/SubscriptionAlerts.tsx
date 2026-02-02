"use client";
import { useQuery } from "@tanstack/react-query";
import { GetUpcomingRecurringTransactions } from "@/app/(dashboard)/_actions/recurring";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BellRing, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { format, differenceInDays } from "date-fns";
import { GetFormatterForCurrency } from "@/lib/helper";

export function SubscriptionAlerts() {
    const { data: upcoming, isLoading } = useQuery({
        queryKey: ["upcoming-recurring"],
        queryFn: () => GetUpcomingRecurringTransactions(3), // 3 days
    });

    const [visible, setVisible] = useState(true);
    const [userCurrency, setUserCurrency] = useState("USD");

    useEffect(() => {
        fetch("/api/user-settings")
            .then(res => res.json())
            .then(data => setUserCurrency(data.currency || "USD"));
    }, []);

    const formatter = GetFormatterForCurrency(userCurrency);

    if (isLoading || !upcoming || upcoming.length === 0 || !visible) return null;

    // Filter to exclude ones that are already processed today? 
    // The server action returns Date <= current + 3 days.
    // Assuming backend updates 'next date' after processing, this list is accurate.

    const count = upcoming.length;
    const nearest = upcoming[0];
    const daysLeft = differenceInDays(new Date(nearest.date), new Date());

    let message = "";
    if (count === 1) {
        const dayText = daysLeft <= 0 ? "today" : `in ${daysLeft} days`;
        message = `${nearest.description} is about to renew for ${formatter.format(nearest.amount)} ${dayText}. Do you still want it?`;
    } else {
        message = `You have ${count} subscriptions renewing in the next 3 days, starting with ${nearest.description}.`;
    }

    return (
        <Alert className="mb-6 bg-violet-50 border-violet-200 text-violet-900 relative shadow-sm">
            <BellRing className="h-4 w-4 text-violet-600" />
            <AlertTitle className="text-violet-800 font-semibold mb-2">Subscription Alert</AlertTitle>
            <AlertDescription className="flex items-center justify-between pr-6">
                <span className="text-violet-700">
                    {message}
                </span>
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-violet-400 hover:text-violet-600 hover:bg-violet-100 absolute top-2 right-2 h-6 w-6"
                    onClick={() => setVisible(false)}
                >
                    <X className="h-4 w-4" />
                </Button>
            </AlertDescription>
        </Alert>
    )
}
