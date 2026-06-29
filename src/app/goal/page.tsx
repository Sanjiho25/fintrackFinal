
'use client';

import * as React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, Repeat, Edit, Trash2 } from 'lucide-react';
import { Suspense } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import TransactionListItem from '@/components/transaction-list-item';

import { useAuth } from '@/context/AuthContext';
import { loadAppData, saveAppData } from '@/lib/storage';
import { formatCurrency, cn } from '@/lib/utils';
import type { AppData, SavingGoal, SavingGoalCategory, Transaction } from '@/types';
import { format, parseISO } from 'date-fns';
import { getCategoryIconComponent } from '@/components/category-icon';

function GoalDetailsContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const goalId = searchParams.get('id');

  const [isLoaded, setIsLoaded] = React.useState(false);
  const [appData, setAppData] = React.useState<AppData | null>(null);
  
  React.useEffect(() => {
    if (user) {
      const data = loadAppData(user.uid);
      setAppData(data);
      setIsLoaded(true);
    }
  }, [user]);

  const goal = React.useMemo(() => {
    if (!appData) return null;
    return appData.savingGoals.find(g => g.id === goalId);
  }, [appData, goalId]);

  const goalCategory = React.useMemo(() => {
    if (!appData || !goal) return null;
    return appData.savingGoalCategories.find(sgc => sgc.id === goal.goalCategoryId);
  }, [appData, goal]);

  const transactions = React.useMemo(() => {
    if (!appData) return [];
    return appData.transactions
      .filter(t => t.category === goalId)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [appData, goalId]);

  const monthlyContribution = React.useMemo(() => {
      if (!appData || !goal || !goal.percentageAllocation) return 0;
      const currentMonth = format(new Date(), 'yyyy-MM');
      const savingsBudget = appData.budgets.find(b => b.category === 'savings' && b.month === currentMonth);
      if (!savingsBudget) return 0;
      return (goal.percentageAllocation / 100) * savingsBudget.limit;
  }, [appData, goal]);

  if (!isLoaded || !appData) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (!goal || !goalCategory) {
    return (
      <div className="p-4 text-center">
        <p className="text-destructive">Goal not found.</p>
        <Link href="/?tab=budgets" passHref>
          <Button variant="link">Go back</Button>
        </Link>
      </div>
    );
  }
  
  const IconComponent = getCategoryIconComponent(goalCategory.icon);
  const progress = goal.targetAmount > 0 ? (goal.savedAmount / goal.targetAmount) * 100 : 0;

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="flex items-center p-4 border-b sticky top-0 bg-background z-10">
        <Link href="/?tab=budgets" passHref>
          <Button asChild variant="ghost" size="icon" aria-label="Back to Budgets">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="ml-2">
            <h1 className="text-lg font-semibold truncate">{goal.name}</h1>
            <p className="text-xs text-muted-foreground">{goalCategory.label}</p>
        </div>
      </header>

      <ScrollArea className="flex-grow">
        <div className="p-4 space-y-4">
           <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <IconComponent className="h-6 w-6 text-accent" />
                        Progress Summary
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <div className="flex justify-between items-end mb-1">
                            <span className="text-sm text-muted-foreground">Saved</span>
                            <p className="text-2xl font-bold text-accent">{formatCurrency(goal.savedAmount)}</p>
                        </div>
                        <Progress value={progress} className="h-3 [&>div]:bg-accent" />
                        <div className="flex justify-between items-center mt-1 text-xs text-muted-foreground">
                            <span>{progress.toFixed(1)}%</span>
                            <span>Target: {formatCurrency(goal.targetAmount)}</span>
                        </div>
                    </div>

                    <Separator />
                    
                    <div className="space-y-3">
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
                </CardContent>
           </Card>
            
           {goal.description && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Description</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm font-medium whitespace-pre-wrap">
                            {goal.description}
                        </p>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Contribution History</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {transactions.length > 0 ? (
                        transactions.map(t => (
                            <TransactionListItem 
                                key={t.id}
                                transaction={t}
                                categories={appData.categories}
                                savingGoals={appData.savingGoals}
                                onViewReceipt={() => {}} // Not needed here or could open receipt dialog
                                onEdit={() => {}} // Not implemented on this page
                                onDelete={() => {}} // Not implemented on this page
                            />
                        ))
                    ) : (
                        <p className="text-sm text-muted-foreground text-center p-6">
                            No contributions have been made to this goal yet.
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
      </ScrollArea>
    </div>
  );
}

export default function GoalDetailsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <GoalDetailsContent />
    </Suspense>
  );
}

    