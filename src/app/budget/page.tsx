
'use client';

import * as React from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { Suspense } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import TransactionListItem from '@/components/transaction-list-item';

import { useAuth } from '@/context/AuthContext';
import { loadAppData } from '@/lib/storage';
import { formatCurrency, cn } from '@/lib/utils';
import type { AppData, Budget, Category, Transaction } from '@/types';
import { getCategoryIconComponent } from '@/components/category-icon';

function BudgetDetailsContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const budgetId = searchParams.get('id');

  const [isLoaded, setIsLoaded] = React.useState(false);
  const [appData, setAppData] = React.useState<AppData | null>(null);
  
  React.useEffect(() => {
    if (user) {
      const data = loadAppData(user.uid);
      setAppData(data);
      setIsLoaded(true);
    }
  }, [user]);

  const budget = React.useMemo(() => {
    if (!appData) return null;
    return appData.budgets.find(b => b.id === budgetId);
  }, [appData, budgetId]);

  const category = React.useMemo(() => {
    if (!appData || !budget) return null;
    return appData.categories.find(c => c.id === budget.category);
  }, [appData, budget]);

  const transactions = React.useMemo(() => {
    if (!appData || !budget) return [];
    return appData.transactions
      .filter(t => t.category === budget.category && t.type === 'expense' && t.date.getMonth() === new Date().getMonth())
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [appData, budget]);

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

  if (!budget || !category) {
    return (
      <div className="p-4 text-center">
        <p className="text-destructive">Budget not found.</p>
        <Link href="/?tab=budgets" passHref>
          <Button variant="link">Go back</Button>
        </Link>
      </div>
    );
  }
  
  const IconComponent = getCategoryIconComponent(category.icon);
  const progress = budget.limit > 0 ? (budget.spent / budget.limit) * 100 : 0;
  const remaining = budget.limit - budget.spent;
  const isOverBudget = remaining < 0;

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="flex items-center p-4 border-b sticky top-0 bg-background z-10">
        <Link href="/?tab=budgets" passHref>
          <Button asChild variant="ghost" size="icon" aria-label="Back to Budgets">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="ml-2">
            <h1 className="text-lg font-semibold truncate">{category.label}</h1>
            <p className="text-xs text-muted-foreground">Expense Budget</p>
        </div>
      </header>

      <ScrollArea className="flex-grow">
        <div className="p-4 space-y-4">
           <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <IconComponent className="h-6 w-6 text-primary" />
                        Budget Summary
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <div className="flex justify-between items-end mb-1">
                            <span className="text-sm text-muted-foreground">Spent</span>
                            <p className="text-2xl font-bold text-primary">{formatCurrency(budget.spent)}</p>
                        </div>
                        <Progress value={progress} className={cn("h-3", isOverBudget ? "[&>div]:bg-destructive" : "[&>div]:bg-primary")} />
                        <div className="flex justify-between items-center mt-1 text-xs text-muted-foreground">
                            <span>{progress.toFixed(1)}% of limit</span>
                            <span>Limit: {formatCurrency(budget.limit)}</span>
                        </div>
                         <div className={cn("text-right text-sm font-medium mt-2", isOverBudget ? 'text-destructive' : 'text-emerald-600')}>
                            {isOverBudget ? `${formatCurrency(Math.abs(remaining))} Over Budget` : `${formatCurrency(remaining)} Remaining`}
                        </div>
                    </div>
                </CardContent>
           </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Transactions This Month</CardTitle>
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
                            No expenses logged for this category this month.
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
      </ScrollArea>
    </div>
  );
}

export default function BudgetDetailsPage() {
  return (
    <Suspense fallback={<div className="flex h-screen w-full items-center justify-center">Loading...</div>}>
      <BudgetDetailsContent />
    </Suspense>
  );
}

    