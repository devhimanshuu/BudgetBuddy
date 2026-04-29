"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { Calendar } from "@/components/ui/calendar";
import { useQuery } from "@tanstack/react-query";
import { format, addMonths, subMonths, isSameDay } from "date-fns";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SkeletonWrapper from "@/components/SkeletonWrapper";
import DayTransactionsSheet from "./DayTransactionsSheet";
import CalendarSettings from "./CalendarSettings";
import { cn } from "@/lib/utils";
import { usePrivacyMode } from "@/components/providers/PrivacyProvider";
import { UserSettings } from "@prisma/client";
import { GetFormatterForCurrency, GetPrivacyMask } from "@/lib/helper";
import { CalendarData } from "@/lib/type";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { CalendarCache } from "@/lib/calendarCache";

interface FinanceCalendarProps {
    userSettings: UserSettings;
}

export default function FinanceCalendar({ userSettings }: FinanceCalendarProps) {
    const { isPrivacyMode } = usePrivacyMode();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [multiplier, setMultiplier] = useState(1.5); // User-selectable multiplier
    const previousErrorRef = useRef<boolean>(false);

    const formatter = useMemo(() => {
        return GetFormatterForCurrency(userSettings.currency);
    }, [userSettings.currency]);

    const calendarQuery = useQuery<CalendarData>({
        queryKey: ["calendar", format(currentMonth, "M"), format(currentMonth, "yyyy"), multiplier],
        queryFn: async () => {
            const month = format(currentMonth, "M");
            const year = format(currentMonth, "yyyy");

            // Try to get from cache first
            const cachedData = CalendarCache.get(month, year, multiplier);
            if (cachedData) {
                console.log("Using cached calendar data");
                return cachedData;
            }

            // Fetch from API
            const response = await fetch(
                `/api/calendar/transactions?month=${month}&year=${year}&multiplier=${multiplier}`
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));

                // Specific error messages based on status
                if (response.status === 400) {
                    throw new Error(errorData.error || "Invalid request parameters");
                } else if (response.status === 401) {
                    throw new Error("Please sign in to view calendar");
                } else if (response.status === 500) {
                    throw new Error("Server error. Please try again later");
                } else {
                    throw new Error("Failed to load calendar data");
                }
            }

            const data = await response.json();

            // Save to cache
            CalendarCache.set(month, year, multiplier, data);

            return data;
        },
        retry: (failureCount, error) => {
            // Don't retry on auth errors
            if (error.message.includes("sign in")) {
                return false;
            }
            return failureCount < 2;
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    // Handle errors with toast notifications
    useEffect(() => {
        if (calendarQuery.isError && calendarQuery.error) {
            toast.error("Calendar Error", {
                description: calendarQuery.error.message,
                action: {
                    label: "Retry",
                    onClick: () => calendarQuery.refetch(),
                },
            });

            // Log to console for debugging (could be sent to monitoring service)
            console.error("Calendar fetch error:", {
                message: calendarQuery.error.message,
                month: format(currentMonth, "M"),
                year: format(currentMonth, "yyyy"),
                multiplier,
                timestamp: new Date().toISOString(),
            });
        }
    }, [calendarQuery, currentMonth, multiplier]);

    // Handle success after error
    useEffect(() => {
        if (calendarQuery.isSuccess && previousErrorRef.current) {
            toast.success("Calendar loaded successfully");
            previousErrorRef.current = false;
        }
        if (calendarQuery.isError) {
            previousErrorRef.current = true;
        }
    }, [calendarQuery.isSuccess, calendarQuery.isError]);

    const handlePreviousMonth = () => {
        setCurrentMonth(subMonths(currentMonth, 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth(addMonths(currentMonth, 1));
    };

    const handleDayClick = (date: Date | undefined) => {
        if (date) {
            setSelectedDate(date);
            setSheetOpen(true);
        }
    };

    const getDayData = (date: Date) => {
        const dateKey = format(date, "yyyy-MM-dd");
        return calendarQuery.data?.days[dateKey];
    };

    const selectedDayData = selectedDate ? getDayData(selectedDate) : null;

    return (
        <div className="space-y-6">
            {/* Calendar Settings */}
            <CalendarSettings
                multiplier={multiplier}
                onMultiplierChange={setMultiplier}
            />

            {/* Month Navigation */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handlePreviousMonth}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-heading-xl">
                            {format(currentMonth, "MMMM yyyy")}
                        </span>

                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handleNextMonth}
                            disabled={format(currentMonth, "yyyy-MM") >= format(new Date(), "yyyy-MM")}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {/* Error State */}
                    {calendarQuery.isError && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error loading calendar</AlertTitle>
                            <AlertDescription className="flex items-center justify-between">
                                <span>Failed to load calendar data. Please try again.</span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => calendarQuery.refetch()}
                                    className="ml-4"
                                >
                                    Retry
                                </Button>
                            </AlertDescription>
                        </Alert>
                    )}

                    <SkeletonWrapper isLoading={calendarQuery.isFetching}>
                        <div className="flex justify-center">
                            <Calendar
                                mode="single"
                                selected={selectedDate || undefined}
                                onSelect={handleDayClick}
                                month={currentMonth}
                                onMonthChange={setCurrentMonth}
                                className="rounded-md border p-4 glass shadow-2xl"
                                components={{
                                    DayButton: (props) => {
                                        const dateKey = format(props.day.date, "yyyy-MM-dd");
                                        const dayData = getDayData(props.day.date);
                                        const isToday = isSameDay(props.day.date, new Date());
                                        const isFuture = props.day.date > new Date();
                                        
                                        // Heatmap logic
                                        const isPayday = dayData && dayData.income > 500; // Significant income
                                        const isHeavyBillDay = dayData && (dayData.isRecurringDue || dayData.isHighSpending);
                                        
                                        // No Spend Streak
                                        const isNoSpendDay = dayData && dayData.expense === 0 && dayData.investment === 0 && !isFuture;

                                        return (
                                            <button
                                                {...props}
                                                className={cn(
                                                    "relative flex h-12 w-12 3xl:h-14 3xl:w-14 items-center justify-center p-0 font-bold transition-all duration-300 hover:scale-110",
                                                    props.className,
                                                    isToday && "ring-2 ring-primary ring-offset-2",
                                                    isPayday && "bg-emerald-500/20 text-emerald-600 rounded-xl",
                                                    isHeavyBillDay && "bg-rose-500/20 text-rose-600 rounded-xl",
                                                    isNoSpendDay && "ring-2 ring-amber-400/50 rounded-full"
                                                )}
                                            >
                                                <span className={cn(
                                                    "z-10",
                                                    isNoSpendDay && "text-amber-600"
                                                )}>{format(props.day.date, "d")}</span>

                                                {/* Indicators */}
                                                <div className="absolute bottom-1.5 left-0 right-0 flex justify-center gap-0.5">
                                                    {(dayData?.income ?? 0) > 0 && (
                                                        <div className="h-1 w-1 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                                    )}
                                                    {dayData?.isRecurringDue && (
                                                        <div className="h-1 w-1 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                                                    )}
                                                    {dayData?.isGoalMilestone && (
                                                        <div className="h-1 w-1 rounded-full bg-amber-400 animate-bounce" />
                                                    )}
                                                </div>

                                                {/* Background Glow for High Spenders */}
                                                {dayData?.isHighSpending && (
                                                    <div className="absolute inset-0 bg-rose-500/10 blur-sm rounded-xl" />
                                                )}
                                            </button>
                                        );
                                    },
                                }}

                            />
                        </div>
                    </SkeletonWrapper>

                    {/* Legend */}
                    <div className="mt-8 grid grid-cols-2 md:grid-cols-5 gap-4 glass p-4 rounded-2xl">
                        <div className="flex items-center gap-2">
                            <div className="h-4 w-4 rounded bg-emerald-500/20 border border-emerald-500/50" />
                            <span className="text-xs font-black uppercase tracking-tighter text-emerald-600">Payday High</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-4 w-4 rounded bg-rose-500/20 border border-rose-500/50" />
                            <span className="text-xs font-black uppercase tracking-tighter text-rose-600">Bill Heavy</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-4 w-4 rounded-full border-2 border-amber-400/50" />
                            <span className="text-xs font-black uppercase tracking-tighter text-amber-600">No Spend Streak</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-amber-400" />
                            <span className="text-xs font-black uppercase tracking-tighter text-muted-foreground">Goal Target</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                            <span className="text-xs font-black uppercase tracking-tighter text-muted-foreground">Predictive Bill</span>
                        </div>
                    </div>

                </CardContent>
            </Card>

            {/* Month Statistics */}
            {calendarQuery.data && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                    <Card className="glass border-emerald-500/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-heading-md text-emerald-600">
                                Total Income
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-heading-lg text-emerald-600">
                                {isPrivacyMode ? GetPrivacyMask(formatter) : formatter.format(calendarQuery.data.monthStats.totalIncome)}
                            </div>
                        </CardContent>
                    </Card>


                    <Card className="glass border-rose-500/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-heading-md text-rose-600">
                                Total Expenses
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-heading-lg text-rose-600">
                                {isPrivacyMode ? GetPrivacyMask(formatter) : formatter.format(calendarQuery.data.monthStats.totalExpense)}
                            </div>
                        </CardContent>
                    </Card>


                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Total Investment
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-indigo-500">
                                {isPrivacyMode ? GetPrivacyMask(formatter) : formatter.format(calendarQuery.data.monthStats.totalInvestment)}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Net Savings
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className={cn(
                                "text-2xl font-bold",
                                (calendarQuery.data.monthStats.totalIncome - calendarQuery.data.monthStats.totalExpense - calendarQuery.data.monthStats.totalInvestment) >= 0
                                    ? "text-emerald-500"
                                    : "text-red-500"
                            )}>
                                {isPrivacyMode ? GetPrivacyMask(formatter) : formatter.format(calendarQuery.data.monthStats.totalIncome - calendarQuery.data.monthStats.totalExpense - calendarQuery.data.monthStats.totalInvestment)}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Avg Daily Expense
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {isPrivacyMode ? GetPrivacyMask(formatter) : formatter.format(calendarQuery.data.monthStats.avgDailyExpense)}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Day Transactions Sheet */}
            <DayTransactionsSheet
                open={sheetOpen}
                onOpenChange={setSheetOpen}
                date={selectedDate}
                dayData={selectedDayData}
                formatter={formatter}
                isPrivacyMode={isPrivacyMode}
            />
        </div>
    );
}
