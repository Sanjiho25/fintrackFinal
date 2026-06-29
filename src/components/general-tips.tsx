"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Scale, PiggyBank, ShieldAlert, Clock, Calendar, Lightbulb, ArrowRight, BookOpen } from "lucide-react";
import Link from "next/link";

interface TipItem {
  title: string;
  description: string;
  icon: React.ElementType;
  colorClass: string;
}

const tipsData: TipItem[] = [
  {
    title: "The 50/30/20 Rule",
    description: "Allocate 50% of your income to Needs (like groceries and transit), 30% to Wants (like dining out and entertainment), and 20% to Savings or goal contributions.",
    icon: Scale,
    colorClass: "text-blue-500 bg-blue-500/10 dark:text-blue-400 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/50"
  },
  {
    title: "Pay Yourself First",
    description: "Don't save what is left after spending. Instead, automatically transfer your target savings or goal allocations immediately when you receive your monthly income.",
    icon: PiggyBank,
    colorClass: "text-emerald-500 bg-emerald-500/10 dark:text-emerald-400 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50"
  },
  {
    title: "Build an Emergency Fund",
    description: "Aim to save 3 to 6 months of basic living expenses. Keep this fund in a separate, liquid account, dedicated only to unexpected events like urgent maintenance or medical costs.",
    icon: ShieldAlert,
    colorClass: "text-amber-500 bg-amber-500/10 dark:text-amber-400 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50"
  },
  {
    title: "The 24-Hour Purchase Rule",
    description: "For non-essential items, wait 24 hours before buying. This simple cooling-off period eliminates impulsive clicks and gives you time to evaluate if it is a need or a want.",
    icon: Clock,
    colorClass: "text-purple-500 bg-purple-500/10 dark:text-purple-400 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900/50"
  },
  {
    title: "Regular Weekly Check-ins",
    description: "Set aside 10 minutes every week to log transactions and review your budget limits. Checking in weekly prevents end-of-month surprises and helps you make quick course corrections.",
    icon: Calendar,
    colorClass: "text-rose-500 bg-rose-500/10 dark:text-rose-400 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50"
  }
];

// Stagger animation container variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
};

export function GeneralTips() {
  return (
    <Card className="border shadow-md overflow-hidden relative group bg-card">
      {/* Decorative top gradient accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent via-primary to-accent/80" />
      
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-accent/10 text-accent">
            <Lightbulb className="h-5 w-5 animate-pulse" />
          </div>
          <CardTitle className="text-lg">General Financial Tips</CardTitle>
        </div>
        <CardDescription>
          Simple, actionable principles to guide your financial journey and build healthy habits.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-3"
        >
          {tipsData.map((tip, index) => {
            const Icon = tip.icon;
            return (
              <motion.div
                key={tip.title}
                variants={itemVariants}
                whileHover={{ scale: 1.01, x: 2 }}
                className="flex items-start p-3 rounded-lg border bg-muted/30 transition-colors hover:bg-muted/60"
              >
                <div className={`p-2 rounded-lg border mr-3 flex-shrink-0 ${tip.colorClass}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-semibold text-sm leading-none text-foreground">{tip.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{tip.description}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        <div className="pt-2 border-t flex justify-end">
          <Link href="/learn/budgeting-guide" passHref>
            <Button variant="ghost" size="sm" className="text-xs text-accent hover:text-accent/80 font-medium group/btn gap-1.5 p-0 hover:bg-transparent">
              <BookOpen className="h-4 w-4 text-accent/80" />
              Read the Full Budgeting Guide
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-1" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
