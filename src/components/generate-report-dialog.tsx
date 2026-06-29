
"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";

interface GenerateReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (fromDate: Date, toDate: Date) => void;
}

export function GenerateReportDialog({
  open,
  onOpenChange,
  onGenerate,
}: GenerateReportDialogProps) {
  const { toast } = useToast();
  const [fromDate, setFromDate] = React.useState<Date | undefined>();
  const [toDate, setToDate] = React.useState<Date | undefined>();

  const handleGenerateClick = () => {
    if (!fromDate || !toDate) {
      toast({
        title: "Invalid Date Range",
        description: "Please select both a start and an end date.",
        variant: "destructive",
      });
      return;
    }
    onGenerate(fromDate, toDate);
  };

  React.useEffect(() => {
    if (open) {
      setFromDate(undefined);
      setToDate(undefined);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Generate Custom Report</DialogTitle>
          <DialogDescription>
            Select a start and end date to generate a financial report.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date-from"
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !fromDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {fromDate ? format(fromDate, "LLL dd, y") : <span>Start date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="single"
                  selected={fromDate}
                  onSelect={(date) => {
                    setFromDate(date);
                    if (date && toDate && date > toDate) {
                      setToDate(date);
                    }
                  }}
                  numberOfMonths={1}
                  disabled={(day) => day > new Date()}
                />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date-to"
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !toDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {toDate ? format(toDate, "LLL dd, y") : <span>End date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="single"
                  selected={toDate}
                  onSelect={setToDate}
                  numberOfMonths={1}
                  disabled={(day) => (fromDate ? day < fromDate : day > new Date()) || day > new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleGenerateClick}>Generate</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
