import { Trophy } from "lucide-react"
import { gradeAttendance } from "@/lib/data"

export function GradeAttendance() {
  const currentDate = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-teal-600 font-bold text-lg mb-1">GRADE-WISE ATTENDANCE</h3>
      <p className="text-gray-500 text-sm mb-4">{currentDate}</p>
      <div className="space-y-3">
        {gradeAttendance.map((item) => (
          <div key={item.grade} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
            <Trophy className="w-5 h-5 text-gray-400" />
            <span className="font-medium text-gray-700 w-16">{item.grade}</span>
            <span className="text-teal-500 text-sm">
              {item.present}/{item.strength}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
