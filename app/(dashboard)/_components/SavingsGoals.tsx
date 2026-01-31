"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { GetFormatterForCurrency } from "@/lib/helper";
import { UserSettings } from "@prisma/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Target,
  Plus,
  Calendar,
  TrendingUp,
  Check,
  Trash2,
  Edit,
  AlertTriangle,
} from "lucide-react";
import { useMemo, useState } from "react";
import SkeletonWrapper from "@/components/SkeletonWrapper";
import { cn } from "@/lib/utils";
import { usePrivacyMode } from "@/components/providers/PrivacyProvider";
import { toast } from "sonner";
import { differenceInDays, format } from "date-fns";
import CreateGoalDialog from "./CreateGoalDialog";
import UpdateGoalDialog from "./UpdateGoalDialog";

interface SavingsGoalsProps {
  userSettings: UserSettings;
}

interface SavingsGoal {
  id: string;
  name: string;
  description: string | null;
  targetAmount: number;
  currentAmount: number;
  targetDate: Date | string;
  category: string;
  icon: string;
  color: string;
  isCompleted: boolean;
}

export default function SavingsGoals({ userSettings }: SavingsGoalsProps) {
  const { isPrivacyMode } = usePrivacyMode();
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<SavingsGoal | null>(null);

  const formatter = useMemo(() => {
    return GetFormatterForCurrency(userSettings.currency);
  }, [userSettings.currency]);

  const goalsQuery = useQuery<SavingsGoal[]>({
    queryKey: ["savings-goals"],
    queryFn: () => fetch("/api/savings-goals").then((res) => res.json()),
  });

  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/savings-goals?id=${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete goal");
      return response.json();
    },
    onSuccess: () => {
      toast.success("Goal deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["savings-goals"] });
    },
    onError: () => {
      toast.error("Failed to delete goal");
    },
  });

  const handleUpdateClick = (goal: SavingsGoal) => {
    setSelectedGoal(goal);
    setUpdateDialogOpen(true);
  };

  const handleDeleteClick = (goal: SavingsGoal) => {
    setGoalToDelete(goal);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (goalToDelete) {
      deleteMutation.mutate(goalToDelete.id);
      setDeleteDialogOpen(false);
      setGoalToDelete(null);
    }
  };

  const activeGoals = goalsQuery.data?.filter((g) => !g.isCompleted) || [];
  const completedGoals = goalsQuery.data?.filter((g) => g.isCompleted) || [];

  return (
    <>
      <SkeletonWrapper isLoading={goalsQuery.isFetching}>
        <Card>
          <CardHeader className="3xl:p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 3xl:gap-3">
                <Target className="h-6 w-6 text-blue-500 3xl:h-8 3xl:w-8" />
                <div>
                  <CardTitle className="3xl:text-2xl">Savings Goals</CardTitle>
                  <CardDescription className="3xl:text-base">
                    Track your financial goals and progress
                  </CardDescription>
                </div>
              </div>
              <CreateGoalDialog
                trigger={
                  <Button className="gap-2 3xl:text-base">
                    <Plus className="h-4 w-4 3xl:h-5 3xl:w-5" />
                    New Goal
                  </Button>
                }
              />
            </div>
          </CardHeader>
          <CardContent className="3xl:p-8 3xl:pt-0">
            {activeGoals.length === 0 && completedGoals.length === 0 ? (
              <div className="flex h-40 items-center justify-center text-muted-foreground 3xl:text-lg">
                No savings goals yet. Create one to start tracking!
              </div>
            ) : (
              <div className="space-y-6 3xl:space-y-8">
                {/* Active Goals */}
                {activeGoals.length > 0 && (
                  <div className="space-y-4 3xl:space-y-6">
                    <h3 className="font-semibold 3xl:text-xl">Active Goals</h3>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 3xl:grid-cols-4 3xl:gap-6">
                      {activeGoals.map((goal) => (
                        <GoalCard
                          key={goal.id}
                          goal={goal}
                          formatter={formatter}
                          onUpdate={() => handleUpdateClick(goal)}
                          onDelete={() => handleDeleteClick(goal)}
                          privacyMode={isPrivacyMode}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Completed Goals */}
                {completedGoals.length > 0 && (
                  <div className="space-y-4 3xl:space-y-6">
                    <h3 className="font-semibold text-emerald-600 3xl:text-xl">
                      Completed Goals 🎉
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 3xl:grid-cols-4 3xl:gap-6">
                      {completedGoals.map((goal) => (
                        <GoalCard
                          key={goal.id}
                          goal={goal}
                          formatter={formatter}
                          onUpdate={() => handleUpdateClick(goal)}
                          onDelete={() => handleDeleteClick(goal)}
                          privacyMode={isPrivacyMode}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </SkeletonWrapper>

      {selectedGoal && (
        <UpdateGoalDialog
          goal={selectedGoal}
          open={updateDialogOpen}
          onOpenChangeAction={setUpdateDialogOpen}
          userSettings={userSettings}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-red-100 p-3 dark:bg-red-900/20">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <AlertDialogTitle>Delete Savings Goal</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this goal?
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>

          {goalToDelete && (
            <div className="my-4 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/20">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{goalToDelete.icon}</span>
                <div>
                  <p className="font-semibold text-red-900 dark:text-red-100">
                    {goalToDelete.name}
                  </p>
                  {goalToDelete.description && (
                    <p className="text-sm text-red-700 dark:text-red-300">
                      {goalToDelete.description}
                    </p>
                  )}
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    Progress: {formatter.format(goalToDelete.currentAmount)} / {formatter.format(goalToDelete.targetAmount)}
                  </p>
                </div>
              </div>
            </div>
          )}

          <AlertDialogDescription className="text-muted-foreground">
            This action cannot be undone. This will permanently delete your savings goal and remove all associated data.
          </AlertDialogDescription>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Delete Goal
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function GoalCard({
  goal,
  formatter,
  onUpdate,
  onDelete,
  privacyMode,
}: {
  goal: SavingsGoal;
  formatter: Intl.NumberFormat;
  onUpdate: () => void;
  onDelete: () => void;
  privacyMode: boolean;
}) {
  const progress = (goal.currentAmount / goal.targetAmount) * 100;
  const remaining = goal.targetAmount - goal.currentAmount;
  const targetDate = new Date(goal.targetDate);
  const daysRemaining = differenceInDays(targetDate, new Date());
  const isOverdue = daysRemaining < 0 && !goal.isCompleted;

  return (
    <Card
      className={cn(
        "relative overflow-hidden",
        goal.isCompleted && "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20"
      )}
    >
      {/* Color accent */}
      <div
        className="absolute left-0 top-0 h-full w-1"
        style={{ backgroundColor: goal.color }}
      />

      <CardHeader className="pb-3 3xl:pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 3xl:gap-3">
            <span className="text-2xl 3xl:text-3xl">{goal.icon}</span>
            <div>
              <CardTitle className="text-base 3xl:text-lg">{goal.name}</CardTitle>
              {goal.description && (
                <CardDescription className="text-xs 3xl:text-sm">
                  {goal.description}
                </CardDescription>
              )}
            </div>
          </div>
          {goal.isCompleted && (
            <div className="rounded-full bg-emerald-500 p-1">
              <Check className="h-4 w-4 text-white" />
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3 3xl:space-y-4">
        {/* Progress */}
        <div className="space-y-2 3xl:space-y-3">
          <div className="flex justify-between text-sm 3xl:text-base">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-semibold">{progress.toFixed(0)}%</span>
          </div>
          <Progress
            value={Math.min(progress, 100)}
            className="h-2 3xl:h-3"
            style={
              {
                "--progress-color": goal.color,
              } as React.CSSProperties
            }
          />
          <div className={cn("flex justify-between text-xs text-muted-foreground 3xl:text-sm", privacyMode && "privacy-blur")}>
            <span>{privacyMode ? "$******" : formatter.format(goal.currentAmount)}</span>
            <span>{privacyMode ? "$******" : formatter.format(goal.targetAmount)}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-lg bg-muted p-2 3xl:p-3">
            <p className="text-xs text-muted-foreground 3xl:text-sm">Remaining</p>
            <p className={cn("font-semibold 3xl:text-base", privacyMode && "privacy-blur")}>
              {privacyMode ? "$******" : formatter.format(remaining)}
            </p>
          </div>
          <div className="rounded-lg bg-muted p-2 3xl:p-3">
            <p className="text-xs text-muted-foreground 3xl:text-sm">Target Date</p>
            <p className={cn("font-semibold 3xl:text-base", isOverdue && "text-red-600")}>
              {format(targetDate, "MMM dd, yyyy")}
            </p>
          </div>
        </div>

        {/* Days countdown */}
        {!goal.isCompleted && (
          <div
            className={cn(
              "flex items-center gap-2 rounded-lg p-2 text-sm 3xl:p-3 3xl:text-base",
              isOverdue
                ? "bg-red-50 text-red-700 dark:bg-red-950/20"
                : "bg-blue-50 text-blue-700 dark:bg-blue-950/20"
            )}
          >
            <Calendar className="h-4 w-4 3xl:h-5 3xl:w-5" />
            <span>
              {isOverdue
                ? `${Math.abs(daysRemaining)} days overdue`
                : `${daysRemaining} days remaining`}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 3xl:text-base"
            onClick={onUpdate}
          >
            <TrendingUp className="mr-2 h-4 w-4 3xl:mr-3 3xl:h-5 3xl:w-5" />
            Update
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onDelete}
            className="text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4 3xl:h-5 3xl:w-5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
