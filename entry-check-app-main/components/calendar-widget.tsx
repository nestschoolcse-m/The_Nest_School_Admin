"use client";

import { useDate } from "@/contexts/date-context";
import { cn } from "@/lib/utils";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from "date-fns";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function CalendarWidget() {
  const { selectedDate, setSelectedDate } = useDate();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Automatically highlight today's date on initial load
  useEffect(() => {
    if (!selectedDate) {
      setSelectedDate(new Date());
    }
  }, [selectedDate, setSelectedDate]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  // Generate calendar days
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Get the day of week for the first day (0 = Sunday, 6 = Saturday)
  const startDay = monthStart.getDay();
  
  // Create empty cells for days before the first day of month
  const emptyCells = Array.from({ length: startDay }).map((_, i) => (
    <div key={`empty-${i}`} className="flex justify-center items-center h-10 w-10"></div>
  ));

  const weekdays = ["S", "M", "T", "W", "T", "F", "S"];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8 w-full">
      {/* Calendar Header */}
      <div className="relative flex flex-col items-center justify-center mb-8">
        <button
          onClick={handlePrevMonth}
          className="absolute left-0 p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-50 rounded-full transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <div className="text-center">
          <div className="text-xl font-bold text-slate-800">
            {format(currentMonth, "MMMM yyyy")}
          </div>
          <div className="text-sm text-slate-400 font-medium mt-1">
            {selectedDate ? format(selectedDate, "EEEE, MMMM d") : format(new Date(), "EEEE, MMMM d")}
          </div>
        </div>
        
        <button
          onClick={handleNextMonth}
          className="absolute right-0 p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-50 rounded-full transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 mb-6">
        {weekdays.map((day, index) => (
          <div
            key={index}
            className="text-center text-sm font-medium text-slate-400"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-y-6">
        {/* Empty cells for days before month start */}
        {emptyCells}
        
        {/* Actual days of the month */}
        {monthDays.map((date, index) => {
          const isCurrentDay = isToday(date);
          const isSelected = selectedDate && isSameDay(date, selectedDate);
          const isCurrentMonthDate = isSameMonth(date, currentMonth);
          const isWeekendDay = date.getDay() === 0 || date.getDay() === 6;

          return (
            <div key={index} className="flex justify-center items-center">
              <button
                onClick={() => !isWeekendDay && handleDateSelect(date)}
                disabled={isWeekendDay}
                className={cn(
                  "h-10 w-10 rounded-full text-sm font-medium transition-all duration-200 flex items-center justify-center",
                  "focus:outline-none",
                  !isCurrentMonthDate && "text-slate-300 opacity-50",
                  isCurrentMonthDate && !isSelected && !isCurrentDay && !isWeekendDay && "text-slate-700 hover:bg-slate-50",
                  isSelected && !isWeekendDay && "bg-nest-800 text-white shadow-sm ring-2 ring-nest-300 ring-offset-2",
                  isCurrentDay && !isSelected && "border-[1.5px] border-nest-400 text-nest-700",
                  isWeekendDay && "cursor-not-allowed bg-slate-50",
                  isWeekendDay && !isCurrentDay && "text-slate-300 opacity-60",
                  isWeekendDay && isCurrentDay && "opacity-80"
                )}
              >
                {format(date, "d")}
              </button>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-8 pt-6 border-t border-slate-50">
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded-full border-[1.5px] border-nest-400"></div>
          <span className="text-xs font-medium text-slate-500">Today</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded-full bg-nest-800"></div>
          <span className="text-xs font-medium text-slate-500">Selected</span>
        </div>
      </div>
    </div>
  );
}