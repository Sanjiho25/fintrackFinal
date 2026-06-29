
"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, BarChartHorizontalBig, Calendar, TrendingDown, TrendingUp, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { loadAppData, saveAppData } from "@/lib/storage";
import type { AppData, MonthlyReport, Transaction } from "@/types";
import { format, parse, startOfDay, endOfDay } from "date-fns";
import { formatCurrency, cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { GenerateReportDialog } from "@/components/generate-report-dialog"; // New component
import { useToast } from "@/hooks/use-toast";

export default function MonthlyReportsPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [appData, setAppData] = React.useState<AppData | null>(null);
    const [isLoaded, setIsLoaded] = React.useState(false);
    const [isGenerateReportDialogOpen, setIsGenerateReportDialogOpen] = React.useState(false);

    React.useEffect(() => {
        if (user) {
            const data = loadAppData(user.uid);
            setAppData(data);
            setIsLoaded(true);
        }
    }, [user]);
    
    React.useEffect(() => {
        if (isLoaded && appData && user) {
            saveAppData(appData, user.uid);
        }
    }, [appData, isLoaded, user]);

    const sortedReports = React.useMemo(() => {
        if (!appData?.monthlyReports) return [];
        // Sort by the 'month' string, which should be 'YYYY-MM' or a custom date range string
        return [...appData.monthlyReports].sort((a, b) => b.month.localeCompare(a.month));
    }, [appData?.monthlyReports]);
    
    const handleGenerateReport = (fromDate: Date, toDate: Date) => {
        if (!appData || !user) return;
        
        const start = startOfDay(fromDate);
        const end = endOfDay(toDate);

        const transactionsInRange = appData.transactions.filter(t => {
            const transactionDate = new Date(t.date);
            return transactionDate >= start && transactionDate <= end;
        });

        if (transactionsInRange.length === 0) {
            toast({
                title: "No Data",
                description: "No transactions found in the selected date range.",
                variant: "destructive"
            });
            return;
        }

        const totalIncome = transactionsInRange.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const totalExpenses = transactionsInRange.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

        const expenseBreakdownMap: Record<string, { categoryLabel: string, amount: number }> = {};
        transactionsInRange.filter(t => t.type === 'expense').forEach(t => {
            const category = appData.categories.find(c => c.id === t.category);
            const label = category?.label || 'Uncategorized';
            if (!expenseBreakdownMap[t.category]) {
                expenseBreakdownMap[t.category] = { categoryLabel: label, amount: 0 };
            }
            expenseBreakdownMap[t.category].amount += t.amount;
        });
        
        const reportTitle = `${format(start, 'MMM d, yyyy')} - ${format(end, 'MMM d, yyyy')}`;

        const newReport: MonthlyReport = {
            month: reportTitle,
            totalIncome,
            totalExpenses,
            netSavings: totalIncome - totalExpenses,
            expenseBreakdown: Object.entries(expenseBreakdownMap).map(([categoryId, data]) => ({
                categoryId,
                ...data
            })),
        };

        setAppData(prev => {
            if (!prev) return null;
            return {
                ...prev,
                monthlyReports: [...prev.monthlyReports, newReport]
            }
        });
        
        toast({
            title: "Report Generated",
            description: `Your custom report for "${reportTitle}" has been created.`
        });
        setIsGenerateReportDialogOpen(false);
    };

    return (
        <div className="flex flex-col h-screen bg-background">
            <div className="flex items-center p-4 border-b sticky top-0 bg-background z-10">
                <Link href="/profile" passHref>
                    <Button asChild variant="ghost" size="icon" aria-label="Back to Profile">
                       <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <h1 className="text-xl font-semibold ml-2">Reports</h1>
                <Button size="sm" className="ml-auto" onClick={() => setIsGenerateReportDialogOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4"/> Generate Report
                </Button>
            </div>

            <ScrollArea className="flex-grow p-4">
                {!isLoaded ? (
                     <div className="space-y-4">
                        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
                    </div>
                ) : !sortedReports || sortedReports.length === 0 ? (
                    <Card className="border-dashed mt-4">
                        <CardContent className="p-6 text-center text-muted-foreground">
                            <Calendar className="mx-auto h-8 w-8 mb-2" />
                            <p className="font-semibold">No Reports Found</p>
                            <p className="text-sm">
                                Click "Generate Report" to create your first financial summary.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <Accordion type="single" collapsible className="w-full space-y-2">
                        {sortedReports.map((report) => (
                             <AccordionItem value={report.month} key={report.month} className="border-b-0">
                                <Card className="rounded-lg shadow-sm">
                                    <AccordionTrigger className="p-4 hover:no-underline rounded-lg data-[state=open]:bg-secondary/50">
                                        <div className="flex flex-col items-start text-left">
                                            <p className="font-semibold text-base">
                                                {report.month.startsWith('20') ? format(parse(report.month, 'yyyy-MM', new Date()), 'MMMM yyyy') : report.month}
                                            </p>
                                            <p className={cn("text-sm", report.netSavings >= 0 ? 'text-accent' : 'text-destructive')}>
                                                Net Savings: {formatCurrency(report.netSavings)}
                                            </p>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="px-4 pb-4">
                                        <div className="space-y-3 pt-2 border-t">
                                             <div className="flex items-center justify-between text-sm">
                                                <span className="flex items-center gap-2 text-muted-foreground"><TrendingUp className="h-4 w-4"/>Total Income</span>
                                                <span className="font-medium text-accent">{formatCurrency(report.totalIncome)}</span>
                                             </div>
                                             <div className="flex items-center justify-between text-sm">
                                                <span className="flex items-center gap-2 text-muted-foreground"><TrendingDown className="h-4 w-4"/>Total Expenses</span>
                                                <span className="font-medium">{formatCurrency(report.totalExpenses)}</span>
                                             </div>

                                            {report.expenseBreakdown.length > 0 && (
                                                <div className="pt-2">
                                                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2"><BarChartHorizontalBig className="h-4 w-4"/>Expense Breakdown</h4>
                                                    <div className="space-y-1 pl-2">
                                                        {report.expenseBreakdown.sort((a,b) => b.amount - a.amount).map(item => (
                                                            <div key={item.categoryId} className="flex justify-between items-center text-xs">
                                                                <span className="text-muted-foreground">{item.categoryLabel}</span>
                                                                <span className="font-mono">{formatCurrency(item.amount)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </AccordionContent>
                                </Card>
                            </AccordionItem>
                        ))}
                    </Accordion>
                )}
            </ScrollArea>
            <GenerateReportDialog
                open={isGenerateReportDialogOpen}
                onOpenChange={setIsGenerateReportDialogOpen}
                onGenerate={handleGenerateReport}
            />
        </div>
    );
}
