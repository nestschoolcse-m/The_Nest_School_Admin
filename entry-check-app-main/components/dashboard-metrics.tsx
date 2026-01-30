"use client";

import { useEffect, useState } from "react";
import { Home, Users, LogOut, RefreshCw } from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { getDashboardMetrics } from "@/lib/firestore-service";
import { useDate } from "@/contexts/date-context";

export function DashboardMetrics() {
  const { selectedDate, isToday } = useDate();
  const [metrics, setMetrics] = useState({
    totalStudents: 0,
    studentsEntry: 0,
    studentExit: 0,
    earlierPickups: 0,
    afterSchool: 0,
    onVehicle: 0,
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const data = await getDashboardMetrics(selectedDate);
      setMetrics(data);
      setLastUpdated(new Date());
    } catch (error) {
      // Silent error
    } finally {
      setLoading(false);
    }
  };

  // Fetch when component mounts or selected date changes
  useEffect(() => {
    fetchMetrics();
  }, [selectedDate]);

  // Only auto-refresh if viewing today's data
  useEffect(() => {
    if (!isToday) return;

    const interval = setInterval(fetchMetrics, 60000);
    return () => clearInterval(interval);
  }, [isToday, selectedDate]);

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
            onClick={fetchMetrics}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1 rounded hover:bg-gray-100 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      <div className="flex justify-center">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl">
          <StatCard
            icon={Home}
            label="Number of Students"
            value={metrics.totalStudents}
            iconClassName="text-gray-700"
            valueClassName="text-teal-600"
          />
          <StatCard
            icon={Users}
            label="Students Entry"
            value={metrics.studentsEntry}
            iconClassName="text-gray-700"
            valueClassName="text-teal-600"
          />
          <StatCard
            icon={LogOut}
            label="Student Exit"
            value={metrics.studentExit}
            iconClassName="text-teal-500"
            valueClassName="text-teal-600"
          />
        </div>
      </div>
    </div>
  );
}
