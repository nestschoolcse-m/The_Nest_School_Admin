"use client";

import { DashboardMetrics } from "@/components/dashboard-metrics";
import { GradeAttendance } from "@/components/grade-attendance";
import { CalendarWidget } from "@/components/calendar-widget";
import { StudentTable } from "@/components/student-table";

export function DashboardContent() {
  return (
    <div className="p-6 space-y-6">
      {/* Admin Title */}
      <div className="flex justify-end">
        <h1 className="text-2xl font-bold text-teal-600 italic">The Nest School Admin Dashboard</h1>
      </div>

      {/* Stats Grid - Now fetches from Firebase based on selected date */}
      <DashboardMetrics />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar and Table */}
        <div className="lg:col-span-2 space-y-6">
          <CalendarWidget />
          
        </div>

        {/* Grade Attendance - Updates based on selected date */}
        <div>
          <GradeAttendance />
        </div>
      </div>
    </div>
  );
}
