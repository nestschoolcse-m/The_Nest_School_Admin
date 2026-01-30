"use client";

import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import { getGradeWiseAttendance } from "@/lib/firestore-service";
import { useDate } from "@/contexts/date-context";

interface GradeAttendanceData {
  grade: string;
  strength: number;
  present: number;
}

export function GradeAttendance() {
  const { selectedDate, isToday } = useDate();
  const [gradeAttendance, setGradeAttendance] = useState<GradeAttendanceData[]>(
    [],
  );
  const [loading, setLoading] = useState(true);

  const fetchGradeAttendance = async () => {
    try {
      setLoading(true);
      const data = await getGradeWiseAttendance(selectedDate);
      setGradeAttendance(data);
    } catch (error) {
      console.error("Error fetching grade attendance:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch when component mounts or selected date changes
  useEffect(() => {
    fetchGradeAttendance();
  }, [selectedDate]);

  // Only auto-refresh if viewing today's data
  useEffect(() => {
    if (!isToday) return;

    const interval = setInterval(fetchGradeAttendance, 60000);
    return () => clearInterval(interval);
  }, [isToday, selectedDate]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-teal-600 font-bold text-lg mb-1">
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
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-teal-600 font-bold text-lg mb-1">
        GRADE-WISE ATTENDANCE
      </h3>
      <p className="text-gray-500 text-sm mb-4">
        {selectedDate.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })}
      </p>
      <div className="space-y-3 max-h-[400px] overflow-y-auto">
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
                className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <span className="text-xs font-medium text-gray-400 w-4">
                  {index + 1}.
                </span>
                <Trophy className="w-5 h-5 text-gray-400" />
                <span className="font-medium text-gray-700 w-20">
                  {item.grade}
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-teal-500 text-sm font-medium">
                      {item.present}/{item.strength}
                    </span>
                    <span className="text-xs text-gray-500">{percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-teal-500 h-1.5 rounded-full transition-all duration-300"
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
