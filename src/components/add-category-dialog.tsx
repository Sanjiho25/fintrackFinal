
"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import * as LucideIcons from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area"; 


import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox"; 
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Category } from "@/types";
import { getCategoryIconComponent } from '@/components/category-icon'; 


const formSchema = z.object({
  label: z.string().min(1, "Category name is required").max(50, "Name max 50 chars"),
  icon: z.string().min(1, "Icon is required"), 
  parentId: z.string().optional().nullable(), 
  isIncomeSource: z.boolean().default(false), 
});

type CategoryFormValues = z.infer<typeof formSchema>;

interface AddCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveCategory: (category: Omit<Category, 'id'> & { id?: string }) => void; 
  existingCategory: Category | null; 
  categories: Category[]; 
}


const iconNames: (keyof typeof LucideIcons)[] = [
  // General & Shopping
  "Archive", "Award", "Badge", "Basket", "Gift", "ShoppingCart", "Tag", "Ticket", "Store",
  // Finance & Money
  "Banknote", "Bitcoin", "Coins", "CreditCard", "DollarSign", "Landmark", "PiggyBank", "Receipt", "Wallet",
  // Food & Drink
  "Banana", "Beer", "Carrot", "CupSoda", "Egg", "Utensils", "UtensilsCrossed", "Wine",
  // Travel & Transport
  "BaggageClaim", "Bike", "Bus", "Car", "Fuel", "Plane", "PlaneTakeoff", "Train", "Truck",
  // Home & Bills
  "Bed", "Building", "Droplet", "Home", "Phone", "Plug", "Smartphone", "Umbrella", "Wifi", "Zap",
  // People & Health
  "Accessibility", "Dog", "Dumbbell", "Heart", "HeartHandshake", "HeartPulse", "PersonStanding", "Smile",
  // Work & Education
  "Book", "BookOpen", "Briefcase", "Calculator", "Calendar", "GraduationCap", "Pen", "School",
  // Tech & Entertainment
  "Airplay", "Camera", "Computer", "Gamepad2", "Headphones", "Laptop", "Monitor", "Mouse", "Music", "Youtube",
  // Other
  "Activity", "AlertCircle", "Bell", "Bookmark", "Check", "Circle", "Clock", "Cog", "Flag", "Folder", "HelpCircle", "Key", "Lightbulb", "Lock", "Map", "Package", "PartyPopper", "Puzzle", "Shield", "Star", "TrendingDown", "TrendingUp", "Trophy", "Wrench", "X"
].sort();



export function AddCategoryDialog({ open, onOpenChange, onSaveCategory, existingCategory, categories }: AddCategoryDialogProps) {
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: existingCategory ? {
        label: existingCategory.label,
        icon: existingCategory.icon,
        parentId: existingCategory.parentId,
        isIncomeSource: existingCategory.isIncomeSource ?? false,
    } : {
      label: "",
      icon: "HelpCircle", 
      parentId: null,
      isIncomeSource: false,
    },
  });

   React.useEffect(() => {
        form.reset(existingCategory ? {
            label: existingCategory.label,
            icon: existingCategory.icon,
            parentId: existingCategory.parentId, 
            isIncomeSource: existingCategory.isIncomeSource ?? false,
        } : {
            label: "",
            icon: "HelpCircle",
            parentId: null, 
            isIncomeSource: false,
        });
    }, [open, existingCategory, form]);


  const onSubmit = (values: CategoryFormValues) => {
     if (existingCategory && values.parentId === existingCategory.id) {
         form.setError("parentId", { message: "Cannot set category as its own parent." });
         return;
     }
     if (values.isIncomeSource && values.parentId) {
         form.setError("parentId", { message: "Income source categories cannot be sub-categories." });
         return;
     }
     const parentCategory = categories.find(c => c.id === values.parentId);
     if (!values.isIncomeSource && parentCategory && parentCategory.isIncomeSource) {
         form.setError("parentId", { message: "Expense categories cannot have an income source as parent." });
         return;
     }

    const dataToSave: Omit<Category, 'id'> & { id?: string } = {
        ...values,
    };
    if (existingCategory) {
      dataToSave.id = existingCategory.id;
      dataToSave.isIncomeSource = existingCategory.isIncomeSource;
    }
    onSaveCategory(dataToSave);
    onOpenChange(false); 
  };

   const potentialParents = React.useMemo(() => {
        const safeCategories = Array.isArray(categories) ? categories : [];
        return safeCategories.filter(c =>
            c && 
            !c.isIncomeSource && 
            c.id !== existingCategory?.id 
        );
    }, [categories, existingCategory]);

    const isIncomeSourceChecked = form.watch('isIncomeSource');


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] flex flex-col max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{existingCategory ? "Edit Category" : "Add Category"}</DialogTitle>
          <DialogDescription>
            {existingCategory ? "Update the details for this category." : "Create a new category for income or expenses."}
          </DialogDescription>
        </DialogHeader>
         <ScrollArea className="flex-grow overflow-y-auto pr-6 -mr-6"> 
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} id="category-form" className="space-y-4 py-1">
              <FormField
                control={form.control}
                name="label"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Groceries, Salary, Water Bill" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="icon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Icon</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                           <div className="flex items-center gap-2">
                              {field.value && React.createElement(getCategoryIconComponent(field.value), { className: "h-4 w-4 text-muted-foreground" })}
                              <SelectValue placeholder="Select an icon" />
                           </div>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(iconNames || []).map((iconName) => {
                           const Icon = getCategoryIconComponent(iconName);
                           return (
                             <SelectItem key={iconName} value={iconName}>
                               <div className="flex items-center gap-2">
                                 <Icon className="h-4 w-4 text-muted-foreground" />
                                 <span>{iconName}</span>
                               </div>
                             </SelectItem>
                           );
                         })}
                         {(!iconNames || iconNames.length === 0) && (
                            <SelectItem value="no-icons" disabled>No icons available</SelectItem>
                         )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

               <FormField
                  control={form.control}
                  name="isIncomeSource"
                  render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm bg-secondary/30">
                      <FormControl>
                          <Checkbox
                          checked={field.value}
                          onCheckedChange={(checkedState) => {
                              const checked = !!checkedState; 
                              field.onChange(checked);
                              if (checked) {
                                  form.setValue('parentId', null);
                              }
                          }}
                          disabled={!!existingCategory} 
                          />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                          <FormLabel>
                           Is this an Income Source?
                          </FormLabel>
                          <FormDescription className="text-xs">
                           Check if this category represents income. Income sources cannot be sub-categories.
                          </FormDescription>
                           {existingCategory && <FormDescription className="text-xs text-destructive italic">Type cannot be changed after creation.</FormDescription>}
                      </div>
                       <FormMessage />
                      </FormItem>
                  )}
                  />


               <FormField
                control={form.control}
                name="parentId"
                render={({ field }) => ( 
                  <FormItem>
                    <FormLabel>Parent Category (Optional)</FormLabel>
                    <Select
                      onValueChange={(selectedValue) => { 
                        if (selectedValue === "_NONE_") {
                          field.onChange(null); 
                        } else {
                          field.onChange(selectedValue); 
                        }
                      }}
                      value={field.value === null ? "_NONE_" : (field.value || undefined)}
                      disabled={isIncomeSourceChecked}
                    >
                      <FormControl>
                        <SelectTrigger disabled={isIncomeSourceChecked}>
                          <SelectValue placeholder={isIncomeSourceChecked ? "N/A (Income Source)" : "Select a parent (optional)"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="_NONE_">-- None (Top Level Expense) --</SelectItem>
                         {(potentialParents || []).map((category) => {
                            if (!category || !category.id) { 
                                console.warn("AddCategoryDialog: Skipping invalid category in potentialParents during map", category);
                                return null;
                            }
                            const Icon = getCategoryIconComponent(category.icon);
                            return (
                             <SelectItem key={category.id} value={category.id}>
                               <div className="flex items-center gap-2">
                                 <Icon className="h-4 w-4 text-muted-foreground" />
                                 <span>{category.label}</span>
                               </div>
                             </SelectItem>
                            );
                          })}
                      </SelectContent>
                    </Select>
                     <FormDescription className="text-xs">Make this an expense sub-category by selecting a non-income parent.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />


            </form>
          </Form>
         </ScrollArea> 
        <DialogFooter className="mt-auto pt-4 border-t"> 
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" form="category-form">{existingCategory ? "Save Changes" : "Add Category"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
