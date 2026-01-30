"use client";

import React, { createContext, useContext, useState } from "react";

interface DateContextType {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  isToday: boolean;
}

const DateContext = createContext<DateContextType | undefined>(undefined);

export function DateProvider({ children }: { children: React.ReactNode }) {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const isToday = selectedDate.toDateString() === new Date().toDateString();

  return (
    <DateContext.Provider value={{ selectedDate, setSelectedDate, isToday }}>
      {children}
    </DateContext.Provider>
  );
}

export function useDate() {
  const context = useContext(DateContext);
  if (context === undefined) {
    throw new Error("useDate must be used within a DateProvider");
  }
  return context;
}
