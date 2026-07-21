"use client";

import { Home, Users, LogOut, RefreshCw } from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { useDashboardData } from "@/contexts/dashboard-data-context";
import { useDate } from "@/contexts/date-context";

export function DashboardMetrics() {
  const { selectedDate, isToday } = useDate();
  const {
    totalStudents,
    studentsEntry,
    studentExit,
    loading,
    lastUpdated,
    refreshMetrics,
  } = useDashboardData();

  if (loading) {
    return (
      <div className="flex justify-center">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-24 bg-gray-200 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-sm text-gray-500">
        <div className="flex items-center gap-4">
          <span>
            {selectedDate.toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
          {!isToday && (
            <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">
              Historical Data
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          {lastUpdated && (
            <span className="text-xs">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={refreshMetrics}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1 rounded hover:bg-gray-100 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      <div className="flex justify-center">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
          <StatCard
            icon={Home}
            label="Number of Students"
            value={totalStudents}
            iconClassName="text-nest-400"
            valueClassName="text-nest-700"
          />
          <StatCard
            icon={Users}
            label="Students Entry"
            value={studentsEntry}
            iconClassName="text-nest-500"
            valueClassName="text-nest-700"
            href="/logs?type=entry"
          />
          <StatCard
            icon={LogOut}
            label="Student Exit"
            value={studentExit}
            iconClassName="text-nest-600"
            valueClassName="text-nest-700"
            href="/logs?type=exit"
          />
        </div>
      </div>
    </div>
  );
}
