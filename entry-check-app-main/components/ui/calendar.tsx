"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  components,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-0", className)}
      classNames={{
        months: "flex flex-col w-full space-y-0",
        month: "space-y-0 w-full",
        caption: "flex justify-center pt-1 relative items-center mb-2",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 rounded-full"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex w-full",
        head_cell:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] text-center",
        row: "flex w-full mt-1",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-8 w-8 p-0 font-normal aria-selected:opacity-100 rounded-full"
        ),
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "border-2 border-primary",
        day_outside:
          "text-muted-foreground opacity-50 hover:bg-transparent hover:text-muted-foreground",
        day_disabled: "text-muted-foreground opacity-50 cursor-not-allowed",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        PreviousMonthButton: ({ ...props }) => (
          <button
            {...props}
            className="h-7 w-7 flex items-center justify-center hover:bg-accent rounded-full transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        ),
        NextMonthButton: ({ ...props }) => (
          <button
            {...props}
            className="h-7 w-7 flex items-center justify-center hover:bg-accent rounded-full transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        ),
        ...components,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };