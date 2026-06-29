
"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar, Repeat } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import type { SavingGoal, SavingGoalCategory } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { getCategoryIconComponent } from "@/components/category-icon";

interface SavingGoalDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal: SavingGoal | null;
  goalCategory?: SavingGoalCategory;
  monthlyContribution: number;
}

export function SavingGoalDetailsDialog({
  open,
  onOpenChange,
  goal,
  goalCategory,
  monthlyContribution,
}: SavingGoalDetailsDialogProps) {
  if (!goal || !goalCategory) {
    return null;
  }

  const IconComponent = getCategoryIconComponent(goalCategory.icon);
  const progress = goal.targetAmount > 0 ? (goal.savedAmount / goal.targetAmount) * 100 : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md flex flex-col max-h-[85vh]">
        <DialogHeader className="p-4 pb-2 border-b">
          <DialogTitle className="flex items-center gap-2">
             <IconComponent className="h-6 w-6 text-accent" />
             {goal.name}
          </DialogTitle>
          <DialogDescription className="text-xs pt-1">
            Goal Details
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-grow p-4 -m-4 overflow-y-auto">
         <div className="p-4 space-y-4">
            {/* Progress Section */}
            <div>
              <div className="flex justify-between items-end mb-1">
                <span className="text-sm text-muted-foreground">Progress</span>
                <p className="text-2xl font-bold text-accent">{formatCurrency(goal.savedAmount)}</p>
              </div>
              <Progress value={progress} className="h-3 [&>div]:bg-accent" />
              <div className="flex justify-between items-center mt-1 text-xs text-muted-foreground">
                <span>{progress.toFixed(1)}%</span>
                <span>Target: {formatCurrency(goal.targetAmount)}</span>
              </div>
            </div>

            <Separator />
            
            {/* Details Section */}
            <div className="space-y-3">
               <div className="flex justify-between items-center text-sm">
                 <span className="text-muted-foreground">Goal Category</span>
                 <span className="font-medium">{goalCategory.label}</span>
               </div>
                <div className="flex justify-between items-center text-sm">
                 <span className="text-muted-foreground">Monthly Allocation</span>
                 <span className="font-medium">{goal.percentageAllocation?.toFixed(1)}% of Savings</span>
               </div>
                <div className="flex justify-between items-center text-sm">
                 <span className="text-muted-foreground">Est. Monthly Contribution</span>
                 <span className="font-medium">{formatCurrency(monthlyContribution)}</span>
               </div>
                {goal.startDate && (
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground flex items-center gap-1.5"><Calendar className="h-4 w-4" /> Start Date</span>
                        <span className="font-medium">{format(goal.startDate, "PPP")}</span>
                    </div>
                )}
                 {goal.targetDate && (
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground flex items-center gap-1.5"><Calendar className="h-4 w-4" /> Target Date</span>
                        <span className="font-medium">{format(goal.targetDate, "PPP")}</span>
                    </div>
                )}
                 {goal.savingMode && (
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground flex items-center gap-1.5"><Repeat className="h-4 w-4" /> Saving Frequency</span>
                        <span className="font-medium capitalize">{goal.savingMode}</span>
                    </div>
                )}
            </div>

            {goal.description && (
              <>
                <Separator />
                <div>
                  <span className="text-sm text-muted-foreground block mb-1">
                    Description
                  </span>
                  <p className="text-sm font-medium whitespace-pre-wrap">
                    {goal.description}
                  </p>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
        <DialogFooter className="p-4 pt-2 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
