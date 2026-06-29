
"use client";

import * as React from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from "@/components/ui/separator";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Pie, PieChart, Cell, Sector } from 'recharts';
import type { Transaction, Budget, Category, SavingGoal } from '@/types';
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, TrendingDown, Scale, PiggyBank, Info, BarChartHorizontalBig, LineChart, PieChart as PieIcon, CheckCircle, AlertTriangle, Medal } from 'lucide-react';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


interface InsightsViewProps {
    currentMonth: string; // "yyyy-MM"
    previousMonth: string; // "yyyy-MM"
    transactions: Transaction[];
    budgets: Budget[];
    categories: Category[];
    monthlyIncome: number | null; // This is the *current* month's budgeted income
    savingGoals: SavingGoal[]; // Added savingGoals
}

// Consistent colors for charts from globals.css
const chartColors = {
    income: "hsl(var(--chart-2))", 
    expenses: "hsl(var(--chart-5))", 
    savings: "hsl(var(--chart-3))", 
    budgeted: "hsl(var(--chart-4))", 
    spent: "hsl(var(--chart-1))", 
};

// Define chart configs for legends and tooltips
const comparisonChartConfig = {
  Income: { label: "Income", color: chartColors.income },
  Expenses: { label: "Expenses", color: chartColors.expenses },
  Savings: { label: "Net Savings", color: chartColors.savings },
} satisfies ChartConfig;

const budgetVsActualChartConfig = {
  Budgeted: { label: "Budgeted", color: chartColors.budgeted },
  Spent: { label: "Spent", color: chartColors.spent },
} satisfies ChartConfig;

// Predefined ShadCN chart colors
const CHART_COLORS_SHADCN = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];


export const InsightsView: React.FC<InsightsViewProps> = ({
    currentMonth,
    previousMonth,
    transactions,
    budgets,
    categories,
    monthlyIncome, // Current month's budgeted income
    savingGoals, // Added savingGoals
}) => {

    // --- Data Processing ---

    // Filter data for current and previous months
    const currentMonthTransactions = React.useMemo(() => transactions.filter(t => format(t.date, 'yyyy-MM') === currentMonth), [transactions, currentMonth]);
    const previousMonthTransactions = React.useMemo(() => transactions.filter(t => format(t.date, 'yyyy-MM') === previousMonth), [transactions, previousMonth]);
    const currentMonthBudgets = React.useMemo(() => budgets.filter(b => b.month === currentMonth), [budgets, currentMonth]);
    
    // Calculate actual income specifically for the previous month from transactions
    const previousMonthActualIncome = React.useMemo(() => {
        return previousMonthTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
    }, [previousMonthTransactions]);


    // Calculate totals for each month
    const currentMonthTotals = React.useMemo(() => {
        const income = monthlyIncome ?? 0; // Use set income for current month
        const expenses = currentMonthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        const actualSavings = income - expenses; 
        return { income, expenses, actualSavings };
    }, [monthlyIncome, currentMonthTransactions]);

    const previousMonthTotals = React.useMemo(() => {
        const income = previousMonthActualIncome; // Use actual income from previous month's transactions
        const expenses = previousMonthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        const actualSavings = income - expenses;
        return { income, expenses, actualSavings };
    }, [previousMonthActualIncome, previousMonthTransactions]);


    // --- Chart Data Preparation ---

    // Income vs Expense vs Savings Chart Data
    const comparisonData = React.useMemo(() => [
        { name: format(new Date(previousMonth + '-01T00:00:00'), 'MMM yyyy'), Income: previousMonthTotals.income, Expenses: previousMonthTotals.expenses, Savings: previousMonthTotals.actualSavings },
        { name: format(new Date(currentMonth + '-01T00:00:00'), 'MMM yyyy'), Income: currentMonthTotals.income, Expenses: currentMonthTotals.expenses, Savings: currentMonthTotals.actualSavings },
    ].filter(d => d.Income > 0 || d.Expenses > 0 || d.Savings !== 0) 
    , [currentMonth, previousMonth, currentMonthTotals, previousMonthTotals]);

    // Spending by Category (Current Month) - Use top-level categories
    const spendingByCategory = React.useMemo(() => {
        const categoryMap: Record<string, { total: number; label: string }> = {};
        const savingGoalIds = new Set(savingGoals.map(sg => sg.id));

        currentMonthTransactions
            .filter(t => t.type === 'expense')
            .forEach((t) => {
                let id: string;
                let label: string;

                if (savingGoalIds.has(t.category)) {
                    const goal = savingGoals.find(sg => sg.id === t.category);
                    id = t.category;
                    label = goal?.name || "Saving Goal";
                } else {
                    let current = categories.find(c => c.id === t.category);
                    while (current && current.parentId) {
                        const parent = categories.find(c => c.id === current.parentId);
                        if (!parent) break;
                        current = parent;
                    }
                    id = current?.id || t.category;
                    label = current?.label || id;
                }

                if (!categoryMap[id]) {
                    categoryMap[id] = { total: 0, label };
                }
                categoryMap[id].total += t.amount;
            });

         const sortedData = Object.values(categoryMap)
            .map(({ total, label }, index) => ({
                name: label, 
                value: total,
                fill: CHART_COLORS_SHADCN[index % CHART_COLORS_SHADCN.length], 
            }))
            .sort((a, b) => b.value - a.value); 

        const pieChartConfig: ChartConfig = sortedData.reduce((config, item) => {
            config[item.name] = { label: item.name, color: item.fill };
            return config;
        }, {} as ChartConfig);

        return { data: sortedData, config: pieChartConfig };

    }, [currentMonthTransactions, categories, savingGoals]);

    const budgetVsActualData = React.useMemo(() => {
        return currentMonthBudgets
            .filter(b => b.category !== 'savings' && (b.limit > 0 || b.spent > 0)) 
            .map(budget => {
                 const categoryInfo = categories.find(c => c.id === budget.category);
                 return {
                    name: categoryInfo?.label ?? budget.category,
                    Budgeted: budget.limit,
                    Spent: budget.spent,
                 };
            })
            .sort((a, b) => b.Budgeted - a.Budgeted); 
    }, [currentMonthBudgets, categories]);


    // --- Comparison Calculations ---
    const expenseChange = currentMonthTotals.expenses - previousMonthTotals.expenses;
    const expenseChangePercent = previousMonthTotals.expenses > 0 ? (expenseChange / previousMonthTotals.expenses) * 100 : (currentMonthTotals.expenses > 0 ? Infinity : 0);
    const savingsChange = currentMonthTotals.actualSavings - previousMonthTotals.actualSavings;
    const savingsChangePercent = previousMonthTotals.actualSavings !== 0 ? (savingsChange / previousMonthTotals.actualSavings) * 100 : (currentMonthTotals.actualSavings !== 0 ? Infinity : 0);
    const incomeChange = currentMonthTotals.income - previousMonthTotals.income;
    const incomeChangePercent = previousMonthTotals.income > 0 ? (incomeChange / previousMonthTotals.income) * 100 : (currentMonthTotals.income > 0 ? Infinity : 0);

    // --- Key Insights Calculations ---
    const savingsRate = currentMonthTotals.income > 0 ? (currentMonthTotals.actualSavings / currentMonthTotals.income) * 100 : 0;
    const topSpendingCategory = spendingByCategory.data.length > 0 ? spendingByCategory.data[0] : null;
    const overBudgetCategory = budgetVsActualData.find(b => b.Spent > b.Budgeted);


    const formatPercentage = (value: number): string => {
        if (!isFinite(value)) return "(vs ₱0)"; 
        if (isNaN(value)) return "(N/A)";
        return `(${value >= 0 ? '+' : ''}${value.toFixed(1)}%)`;
    };


    return (
        <div className="space-y-4">
            {/* Summary Cards */}
             <Card>
                <CardHeader className="pb-4">
                    <CardTitle>Monthly Snapshot</CardTitle>
                    <CardDescription>
                        A summary of your finances for {format(new Date(currentMonth + '-01T00:00:00'), 'MMMM yyyy')}.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-3">
                    {/* Total Income */}
                    <div className="flex items-center space-x-4 rounded-md border p-4">
                        <TrendingUp className="h-6 w-6 text-muted-foreground" />
                        <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium leading-none">Total Income</p>
                            <p className="text-xl font-bold">{formatCurrency(currentMonthTotals.income)}</p>
                            <p className={`text-xs ${incomeChange >= 0 ? 'text-accent' : 'text-destructive'}`}>
                                {previousMonthTotals.income > 0 || currentMonthTotals.income > 0 ? (
                                    <>
                                        {incomeChange >= 0 ? '+' : ''}{formatCurrency(incomeChange)} {formatPercentage(incomeChangePercent)} vs last month
                                    </>
                                ) : "No income data for comparison"}
                            </p>
                        </div>
                    </div>
                     {/* Total Expenses */}
                     <div className="flex items-center space-x-4 rounded-md border p-4">
                        <TrendingDown className="h-6 w-6 text-muted-foreground" />
                        <div className="flex-1 space-y-1">
                             <p className="text-sm font-medium leading-none">Total Expenses</p>
                            <p className="text-xl font-bold">{formatCurrency(currentMonthTotals.expenses)}</p>
                            <p className={`text-xs ${expenseChange >= 0 && previousMonthTotals.expenses > 0 ? 'text-destructive' : (expenseChange < 0 ? 'text-accent' : 'text-muted-foreground')}`}>
                                {previousMonthTotals.expenses > 0 || currentMonthTotals.expenses > 0 ? (
                                    <>
                                        {expenseChange >= 0 ? '+' : ''}{formatCurrency(expenseChange)} {formatPercentage(expenseChangePercent)} vs last month
                                    </>
                                ) : "No expense data for comparison"}
                            </p>
                        </div>
                    </div>
                     {/* Net Savings */}
                     <div className="flex items-center space-x-4 rounded-md border p-4">
                        <PiggyBank className="h-6 w-6 text-muted-foreground" />
                        <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium leading-none">Net Savings</p>
                            <p className="text-xl font-bold">{formatCurrency(currentMonthTotals.actualSavings)}</p>
                            <p className={`text-xs ${savingsChange >= 0 && previousMonthTotals.actualSavings !== 0 ? 'text-accent' : (savingsChange < 0 ? 'text-destructive' : 'text-muted-foreground')}`}>
                                {previousMonthTotals.actualSavings !== 0 || currentMonthTotals.actualSavings !== 0 ? (
                                    <>
                                        {savingsChange >= 0 ? '+' : ''}{formatCurrency(savingsChange)} {formatPercentage(savingsChangePercent)} vs last month
                                    </>
                                ) : "No savings data for comparison"}
                             </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Key Insights Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Key Insights</CardTitle>
                    <CardDescription>Actionable commentary on your financial habits this month.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                    {topSpendingCategory ? (
                        <div className="flex items-start gap-3">
                            <Medal className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="font-medium">Top Spending Category</p>
                                <p className="text-muted-foreground">Your biggest expense was <span className="font-bold text-foreground">{topSpendingCategory.name}</span>, totaling <span className="font-bold text-foreground">{formatCurrency(topSpendingCategory.value)}</span>.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-start gap-3">
                             <Info className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                             <p className="text-muted-foreground">No spending data available to determine top category.</p>
                        </div>
                    )}
                    
                    {overBudgetCategory ? (
                         <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="font-medium">Budget Performance</p>
                                <p className="text-muted-foreground">You went over budget on <span className="font-bold text-destructive">{overBudgetCategory.name}</span>. Review transactions in this category to see where you can adjust.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-start gap-3">
                            <CheckCircle className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                             <div>
                                <p className="font-medium">Budget Performance</p>
                                <p className="text-muted-foreground">Great job! You've stayed within all your set budgets this month.</p>
                            </div>
                        </div>
                    )}

                    <div className="flex items-start gap-3">
                        <Scale className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="font-medium">Savings Rate</p>
                             <p className="text-muted-foreground">You are saving <span className="font-bold text-foreground">{savingsRate.toFixed(1)}%</span> of your income. Financial experts often recommend a savings rate of 20% or more.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>


            {/* Consolidated Chart Card */}
            <Card>
                <Tabs defaultValue="trend" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 rounded-t-lg rounded-b-none p-0 h-14">
                        <TabsTrigger value="trend" className="rounded-tl-lg h-full text-xs sm:text-sm">
                            <LineChart className="h-4 w-4 mr-1.5"/> Trend
                        </TabsTrigger>
                        <TabsTrigger value="budgets" className="h-full text-xs sm:text-sm">
                             <BarChartHorizontalBig className="h-4 w-4 mr-1.5"/> Budgets
                        </TabsTrigger>
                        <TabsTrigger value="breakdown" className="rounded-tr-lg h-full text-xs sm:text-sm">
                             <PieIcon className="h-4 w-4 mr-1.5"/> Breakdown
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="trend">
                        <CardHeader>
                            <CardTitle>Monthly Overview Trend</CardTitle>
                            <CardDescription>Income, Expenses, and Net Savings compared to last month.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {comparisonData.length > 0 ? (
                                <ChartContainer config={comparisonChartConfig} className="aspect-video max-h-[250px]">
                                    <BarChart data={comparisonData}>
                                        <CartesianGrid vertical={false} />
                                        <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} fontSize={12} />
                                        <YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={(value) => formatCurrency(value as number)} />
                                        <ChartTooltip
                                            cursor={false}
                                            content={<ChartTooltipContent indicator="dot" />}
                                            formatter={(value) => formatCurrency(value as number)}
                                        />
                                        <ChartLegend content={<ChartLegendContent />} />
                                        <Bar dataKey="Income" fill={chartColors.income} radius={4} />
                                        <Bar dataKey="Expenses" fill={chartColors.expenses} radius={4} />
                                        <Bar dataKey="Savings" name="Net Savings" fill={chartColors.savings} radius={4} />
                                    </BarChart>
                                </ChartContainer>
                            ) : (
                                 <p className="text-sm text-muted-foreground text-center py-10">Not enough data for comparison.</p>
                            )}
                        </CardContent>
                    </TabsContent>
                    
                    <TabsContent value="budgets">
                         <CardHeader>
                            <CardTitle>Budget vs Actual Spending</CardTitle>
                            <CardDescription>Comparison of budgeted amounts and actual expenses for {format(new Date(currentMonth + '-01T00:00:00'), 'MMMM yyyy')}.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {budgetVsActualData.length > 0 ? (
                                 <ChartContainer config={budgetVsActualChartConfig} className="aspect-video max-h-[250px]">
                                    <BarChart data={budgetVsActualData} layout="vertical" barSize={15} margin={{ right: 20 }}>
                                        <CartesianGrid horizontal={false} />
                                        <XAxis type="number" tickLine={false} axisLine={false} fontSize={12} tickFormatter={(value) => formatCurrency(value as number)} />
                                        <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} fontSize={12} width={80} interval={0} />
                                        <ChartTooltip
                                             cursor={false}
                                             content={<ChartTooltipContent hideLabel />}
                                             formatter={(value) => formatCurrency(value as number)}
                                         />
                                        <ChartLegend content={<ChartLegendContent />} />
                                        <Bar dataKey="Budgeted" fill={chartColors.budgeted} radius={4} />
                                        <Bar dataKey="Spent" fill={chartColors.spent} radius={4}/>
                                    </BarChart>
                                </ChartContainer>
                            ) : (
                                 <p className="text-sm text-muted-foreground text-center py-10">No budgets set to compare for this month.</p>
                            )}
                        </CardContent>
                    </TabsContent>

                    <TabsContent value="breakdown">
                         <CardHeader>
                            <CardTitle>Expense Breakdown</CardTitle>
                            <CardDescription>Spending by top-level category for {format(new Date(currentMonth + '-01T00:00:00'), 'MMMM yyyy')}.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             {spendingByCategory.data.length > 0 ? (
                                 <ChartContainer config={spendingByCategory.config} className="aspect-square max-h-[250px] mx-auto">
                                     <PieChart>
                                        <ChartTooltip
                                             cursor={false}
                                             content={<ChartTooltipContent hideLabel indicator="dot" />}
                                             formatter={(value) => formatCurrency(value as number)}
                                         />
                                         <Pie
                                             data={spendingByCategory.data}
                                             dataKey="value"
                                             nameKey="name"
                                             cx="50%"
                                             cy="50%"
                                             outerRadius={80}
                                             innerRadius={50} 
                                             strokeWidth={2}
                                             labelLine={false}
                                             label={({
                                                cx,
                                                cy,
                                                midAngle,
                                                innerRadius,
                                                outerRadius,
                                                percent,
                                              }) => {
                                                const RADIAN = Math.PI / 180
                                                const radius = innerRadius + (outerRadius - innerRadius) * 0.5
                                                const x = cx + radius * Math.cos(-midAngle * RADIAN)
                                                const y = cy + radius * Math.sin(-midAngle * RADIAN)
                                          
                                                return (
                                                  <text
                                                    x={x}
                                                    y={y}
                                                    fill="hsl(var(--card-foreground))"
                                                    textAnchor={x > cx ? 'start' : 'end'}
                                                    dominantBaseline="central"
                                                    className="text-xs font-semibold"
                                                  >
                                                    {`${(percent * 100).toFixed(0)}%`}
                                                  </text>
                                                )
                                              }}
                                         >
                                              {spendingByCategory.data.map((entry) => (
                                                 <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                                             ))}
                                         </Pie>
                                         <ChartLegend content={<ChartLegendContent nameKey="name" className="text-xs flex-wrap justify-center"/>} wrapperStyle={{ marginTop: '20px' }} />
                                     </PieChart>
                                 </ChartContainer>
                             ) : (
                                  <p className="text-sm text-muted-foreground text-center py-10">No expense data available for this month.</p>
                             )}
                        </CardContent>
                    </TabsContent>
                </Tabs>
            </Card>
        </div>
    );
};
