"use client";

import { useEffect, useState } from "react";
import {
  Home,
  Users,
  LogOut,
  Clock,
  Bus,
  DoorOpen,
  RefreshCw,
} from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { getDashboardMetrics } from "@/lib/firestore-service";

export function DashboardMetrics() {
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
      const data = await getDashboardMetrics();
      setMetrics(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch on component mount
  useEffect(() => {
    fetchMetrics();

    // Set up auto-refresh every 60 seconds to show live attendance updates
    const interval = setInterval(fetchMetrics, 60000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-sm text-gray-500">
        <span>
          {lastUpdated
            ? `Last updated: ${lastUpdated.toLocaleTimeString()}`
            : "Loading..."}
        </span>
        <button
          onClick={fetchMetrics}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1 rounded hover:bg-gray-100 disabled:opacity-50"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
        <StatCard
          icon={Clock}
          label="Earlier Pickups"
          value={metrics.earlierPickups}
          iconClassName="text-teal-500"
          valueClassName="text-teal-600"
        />
        <StatCard
          icon={Bus}
          label="After School"
          value={metrics.afterSchool}
          iconClassName="text-gray-700"
          valueClassName="text-teal-600"
        />
        <StatCard
          icon={DoorOpen}
          label="On Vehicle"
          value={metrics.onVehicle}
          iconClassName="text-teal-500"
          valueClassName="text-teal-600"
        />
      </div>
    </div>
  );
}
