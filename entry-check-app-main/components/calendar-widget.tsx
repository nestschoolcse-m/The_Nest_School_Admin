"use client";

import { useDate } from "@/contexts/date-context";
import { cn } from "@/lib/utils";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from "date-fns";
import { useState, useEffect } from "react";

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
    <div key={`empty-${i}`} className="h-8 w-8"></div>
  ));

  const weekdays = ["S", "M", "T", "W", "T", "F", "S"];

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden p-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4 px-2">
        <button
          onClick={handlePrevMonth}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <div className="text-center">
          <div className="text-xl font-bold text-gray-800">
            {format(currentMonth, "MMMM yyyy")}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {selectedDate ? format(selectedDate, "EEEE, MMMM d") : format(new Date(), "EEEE, MMMM d")}
          </div>
        </div>
        
        <button
          onClick={handleNextMonth}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekdays.map((day, index) => (
          <div
            key={index}
            className="text-center text-xs font-semibold text-gray-500 py-1"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells for days before month start */}
        {emptyCells}
        
        {/* Actual days of the month */}
        {monthDays.map((date, index) => {
          const isCurrentDay = isToday(date);
          const isSelected = selectedDate && isSameDay(date, selectedDate);
          const isCurrentMonthDate = isSameMonth(date, currentMonth);

          return (
            <button
              key={index}
              onClick={() => handleDateSelect(date)}
              className={cn(
                "h-8 w-8 rounded-full text-sm font-medium transition-all duration-200",
                "flex items-center justify-center mx-auto",
                "hover:bg-gray-100 hover:text-gray-900",
                "focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-1",
                !isCurrentMonthDate && "text-gray-300 opacity-50",
                isSelected && "bg-gradient-to-br from-teal-500 to-emerald-500 text-white shadow-md font-bold",
                isCurrentDay && !isSelected && "border-2 border-teal-500 text-teal-700 font-bold"
              )}
            >
              {format(date, "d")}
              {isCurrentDay && !isSelected && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
                  <div className="w-1 h-1 bg-teal-500 rounded-full"></div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full border-2 border-teal-500"></div>
          <span className="text-xs text-gray-600">Today</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500"></div>
          <span className="text-xs text-gray-600">Selected</span>
        </div>
      </div>
    </div>
  );
}