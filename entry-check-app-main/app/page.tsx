import { Home, Users, LogOut, Clock, Bus, DoorOpen } from "lucide-react";
import { DashboardMetrics } from "@/components/dashboard-metrics";
import { GradeAttendance } from "@/components/grade-attendance";
import { CalendarWidget } from "@/components/calendar-widget";
import { StudentTable } from "@/components/student-table";

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Admin Title */}
      <div className="flex justify-end">
        <h1 className="text-2xl font-bold text-teal-600 italic">Admin-Xpert</h1>
      </div>

      {/* Stats Grid - Now fetches from Firebase */}
      <DashboardMetrics />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar and Table */}
        <div className="lg:col-span-2 space-y-6">
          <CalendarWidget />
          <StudentTable showTodayTransport compact />
        </div>

        {/* Grade Attendance */}
        <div>
          <GradeAttendance />
        </div>
      </div>
    </div>
  );
}
