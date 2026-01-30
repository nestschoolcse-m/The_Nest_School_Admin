"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { useStudents } from "@/hooks/use-students";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

interface StudentTableProps {
  showTodayTransport?: boolean;
  compact?: boolean;
}

export function StudentTable({
  showTodayTransport = false,
  compact = false,
}: StudentTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("All");
  const { students, loading, error } = useStudents();

  // Grade ordering for sorting
  const gradeOrder = [
    "PREKG",
    "LKG",
    "UKG",
    "G1",
    "G2",
    "G3",
    "G4",
    "G5",
    "G6",
    "G7",
    "G8",
    "G9",
    "G10",
  ];

  const getGradeScore = (grade: string) => {
    const baseGrade = grade.split(" ")[0].replace("-", "");
    const index = gradeOrder.indexOf(baseGrade);
    return index === -1 ? 999 : index;
  };

  const filteredStudents = students
    .filter((student) => {
      const matchesSearch =
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.usnNumber.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGrade =
        selectedGrade === "All" || student.grade === selectedGrade;
      return matchesSearch && matchesGrade;
    })
    .sort((a, b) => {
      // Sort by grade first
      const scoreA = getGradeScore(a.grade);
      const scoreB = getGradeScore(b.grade);

      if (scoreA !== scoreB) {
        return scoreA - scoreB;
      }

      // If same base grade, sort by full grade string (for sections like G1 A, G1 B)
      if (a.grade !== b.grade) {
        return a.grade.localeCompare(b.grade);
      }

      // If same grade, sort by name alphabetically
      return a.name.localeCompare(b.name);
    });

  // Get unique grades present in the current student list
  const availableGrades = Array.from(
    new Set(students.map((s) => s.grade))
  ).sort((a, b) => {
    const scoreA = getGradeScore(a);
    const scoreB = getGradeScore(b);
    if (scoreA !== scoreB) return scoreA - scoreB;
    return a.localeCompare(b);
  });

  return (
    <div className="space-y-4">
      {/* Grade Filter Bar */}
      {!loading && !error && !compact && (
        <div className="bg-white p-2 rounded-xl border border-gray-100 shadow-sm overflow-x-auto whitespace-nowrap scrollbar-hide">
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedGrade("All")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedGrade === "All"
                  ? "bg-teal-600 text-white shadow-md"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}
            >
              All Students
            </button>
            <div className="w-px h-8 bg-gray-200 self-center mx-1" />
            {availableGrades.map((grade) => (
              <button
                key={grade}
                onClick={() => setSelectedGrade(grade)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedGrade === grade
                    ? "bg-teal-600 text-white shadow-md"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                }`}
              >
                {grade}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-teal-600 font-semibold italic">
            {showTodayTransport ? "Tabular Column" : "STUDENTS DETAILS"}
            {selectedGrade !== "All" && (
              <span className="ml-2 text-gray-400 font-normal not-italic text-sm">
                ({selectedGrade})
              </span>
            )}
          </h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by name or USN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full md:w-64 border-teal-300 focus:border-teal-500 rounded-lg"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Spinner />
              <span className="ml-3 text-gray-600 font-medium">
                Loading students...
              </span>
            </div>
          )}

          {error && (
            <div className="p-4 text-red-600 bg-red-50 border-l-4 border-red-500 m-4 rounded">
              Error loading students: {error}
            </div>
          )}

          {!loading && !error && (
            <table className="w-full">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    S.NO
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    NAME
                  </th>
                  {!compact && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      USN NUMBER
                    </th>
                  )}
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    GRADE
                  </th>
                  {!compact && !showTodayTransport && (
                    <>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        DATE OF BIRTH
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        FATHER NAME
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        FATHER MOBILE
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        MOTHER NAME
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        MOTHER MOBILE
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student, index) => (
                    <tr
                      key={student.id}
                      className="hover:bg-teal-50/30 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm font-medium text-gray-500">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {student.name}
                      </td>
                      {!compact && (
                        <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                          {student.usnNumber}
                        </td>
                      )}
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium">
                          {student.grade}
                        </span>
                      </td>
                      {!compact && !showTodayTransport && (
                        <>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {student.dob}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {student.fatherName}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {student.fatherMobile || "N/A"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {student.motherName}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {student.motherMobile || "N/A"}
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={compact ? 4 : 9}
                      className="px-4 py-12 text-center text-gray-500 italic"
                    >
                      No students found matching your criteria
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
