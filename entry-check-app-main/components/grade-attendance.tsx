"use client";

import { Trophy } from "lucide-react";
import { useDashboardData } from "@/contexts/dashboard-data-context";
import { useDate } from "@/contexts/date-context";
import { useRouter } from "next/navigation";

export function GradeAttendance() {
  const { selectedDate } = useDate();
  const { gradeAttendance, loading } = useDashboardData();
  const router = useRouter();

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-nest-100">
        <h3 className="text-nest-700 font-bold text-lg mb-1 tracking-wide">
          GRADE-WISE ATTENDANCE
        </h3>
        <p className="text-gray-500 text-sm mb-4">
          {selectedDate.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })}
        </p>
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-2 animate-pulse">
              <div className="w-5 h-5 bg-gray-200 rounded" />
              <div className="w-16 h-4 bg-gray-200 rounded" />
              <div className="w-12 h-4 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm ring-1 ring-nest-100">
      <h3 className="text-nest-700 font-bold text-lg mb-1 tracking-wide">
        GRADE-WISE ATTENDANCE
      </h3>
      <p className="text-gray-500 text-sm mb-4">
        {selectedDate.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })}
      </p>
      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
        {gradeAttendance.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">
            No students found
          </p>
        ) : (
          gradeAttendance.map((item, index) => {
            const percentage =
              item.strength > 0
                ? Math.round((item.present / item.strength) * 100)
                : 0;

            return (
              <div
                key={item.grade}
                onClick={() => router.push(`/logs?grade=${item.grade}`)}
                className="flex items-center gap-3 p-2 hover:bg-nest-50 rounded-xl transition-all cursor-pointer group"
              >
                <span className="text-xs font-medium text-gray-400 w-4">
                  {index + 1}.
                </span>
                <Trophy className="w-5 h-5 text-gray-400 group-hover:text-nest-500 transition-colors" />
                <span className="font-semibold text-gray-700 w-20 group-hover:text-nest-700 transition-colors">
                  {item.grade}
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-nest-600 text-sm font-semibold">
                      {item.present}/{item.strength}
                    </span>
                    <span className="text-xs font-medium text-gray-500">{percentage}%</span>
                  </div>
                  <div className="w-full bg-nest-100 rounded-full h-2">
                    <div
                      className="bg-nest-500 h-2 rounded-full transition-all duration-500 shadow-sm"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
