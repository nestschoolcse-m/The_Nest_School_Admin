"use client";

import { DashboardMetrics } from "@/components/dashboard-metrics";
import { GradeAttendance } from "@/components/grade-attendance";
import { CalendarWidget } from "@/components/calendar-widget";


export function DashboardContent() {
  return (
    <div className="p-6 space-y-6">


      {/* Stats Grid - Now powered by shared DashboardDataContext */}
      <DashboardMetrics />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar and Table */}
        <div className="lg:col-span-2 space-y-6">
          <CalendarWidget />
          
        </div>

        {/* Grade Attendance - Shares data with DashboardMetrics via context */}
        <div>
          <GradeAttendance />
        </div>
      </div>
    </div>
  );
}
