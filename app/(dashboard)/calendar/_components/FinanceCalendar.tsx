"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { Calendar } from "@/components/ui/calendar";
import { useQuery } from "@tanstack/react-query";
import { format, addMonths, subMonths } from "date-fns";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SkeletonWrapper from "@/components/SkeletonWrapper";
import DayTransactionsSheet from "./DayTransactionsSheet";
import CalendarSettings from "./CalendarSettings";
import { cn } from "@/lib/utils";
import { UserSettings } from "@prisma/client";
import { GetFormatterForCurrency } from "@/lib/helper";
import { CalendarData } from "@/lib/type";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { CalendarCache } from "@/lib/calendarCache";

interface FinanceCalendarProps {
    userSettings: UserSettings;
}

export default function FinanceCalendar({ userSettings }: FinanceCalendarProps) {
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
    }, [calendarQuery.isError, calendarQuery.error]);

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
                        <span className="text-2xl font-bold">
                            {format(currentMonth, "MMMM yyyy")}
                        </span>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handleNextMonth}
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
                                className="rounded-md border"
                                components={{
                                    DayButton: (props) => {
                                        const dayData = getDayData(props.day.date);
                                        const hasIncome = dayData && dayData.income > 0;
                                        const hasHighSpending = dayData && dayData.isHighSpending;
                                        const hasNormalSpending = dayData && dayData.expense > 0 && !dayData.isHighSpending;

                                        return (
                                            <button
                                                {...props}
                                                className={cn(
                                                    "relative flex h-9 w-9 items-center justify-center p-0 font-normal",
                                                    props.className
                                                )}
                                            >
                                                <span>{format(props.day.date, "d")}</span>
                                                {/* Indicator dots */}
                                                <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-0.5 pb-0.5">
                                                    {hasIncome && (
                                                        <div className="h-1 w-1 rounded-full bg-emerald-500" />
                                                    )}
                                                    {hasHighSpending && (
                                                        <div className="h-1 w-1 rounded-full bg-red-500" />
                                                    )}
                                                    {hasNormalSpending && !hasIncome && !hasHighSpending && (
                                                        <div className="h-1 w-1 rounded-full bg-gray-400" />
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    },
                                }}
                            />
                        </div>
                    </SkeletonWrapper>

                    {/* Legend */}
                    <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-emerald-500" />
                            <span className="text-muted-foreground">Income</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-red-500" />
                            <span className="text-muted-foreground">High Spending</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-gray-400" />
                            <span className="text-muted-foreground">Normal Spending</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Month Statistics */}
            {calendarQuery.data && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Total Income
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-emerald-500">
                                {formatter.format(calendarQuery.data.monthStats.totalIncome)}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Total Expenses
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-500">
                                {formatter.format(calendarQuery.data.monthStats.totalExpense)}
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
                                (calendarQuery.data.monthStats.totalIncome - calendarQuery.data.monthStats.totalExpense) >= 0
                                    ? "text-emerald-500"
                                    : "text-red-500"
                            )}>
                                {formatter.format(calendarQuery.data.monthStats.totalIncome - calendarQuery.data.monthStats.totalExpense)}
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
                                {formatter.format(calendarQuery.data.monthStats.avgDailyExpense)}
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
            />
        </div>
    );
}
