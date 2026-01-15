import { Home, Users, LogOut, Clock, Bus, DoorOpen } from "lucide-react"
import { StatCard } from "@/components/stat-card"
import { GradeAttendance } from "@/components/grade-attendance"
import { CalendarWidget } from "@/components/calendar-widget"
import { StudentTable } from "@/components/student-table"
import { dashboardStats } from "@/lib/data"

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Admin Title */}
      <div className="flex justify-end">
        <h1 className="text-2xl font-bold text-teal-600 italic">Admin-Xpert</h1>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          icon={Home}
          label="Number of Students"
          value={dashboardStats.totalStudents}
          iconClassName="text-gray-700"
          valueClassName="text-teal-600"
        />
        <StatCard
          icon={Users}
          label="Students Entry"
          value={dashboardStats.studentsEntry}
          iconClassName="text-gray-700"
          valueClassName="text-teal-600"
        />
        <StatCard
          icon={LogOut}
          label="Student Exit"
          value={dashboardStats.studentExit}
          iconClassName="text-teal-500"
          valueClassName="text-teal-600"
        />
        <StatCard
          icon={Clock}
          label="Earlier Pickups"
          value={dashboardStats.earlierPickups}
          iconClassName="text-teal-500"
          valueClassName="text-teal-600"
        />
        <StatCard
          icon={Bus}
          label="After School"
          value={dashboardStats.afterSchool}
          iconClassName="text-gray-700"
          valueClassName="text-teal-600"
        />
        <StatCard
          icon={DoorOpen}
          label="Campus Exit"
          value={dashboardStats.campusExit}
          iconClassName="text-gray-700"
          valueClassName="text-teal-600"
        />
      </div>

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
  )
}
