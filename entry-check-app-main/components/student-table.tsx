"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { useStudents } from "@/hooks/use-students";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function StudentTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const { students, loading, error } = useStudents();

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedGrade]);

  // Grade ordering for sorting
  const gradeOrder = [
    "EYP",
    "PRE KG",
    "LKG",
    "UKG",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "11",
    "12",
  ];

  const getGradeScore = (grade: string) => {
    // Extract base grade (e.g. "PRE KG" from "PRE KG A", "10" from "10A")
    const match = grade.match(/^(PRE KG|PRE-KG|PREKG|LKG|UKG|EYP|G?\d+)/i);
    if (!match) return 999;

    // Normalize (e.g. "G10" -> "10", "PREKG" -> "PRE KG")
    let baseGrade = match[1].toUpperCase();
    if (baseGrade.startsWith("G") && baseGrade.length > 1 && !isNaN(Number(baseGrade[1]))) {
      baseGrade = baseGrade.substring(1); // Remove the 'G' prefix from 'G1', 'G10', etc.
    }
    if (baseGrade === "PREKG" || baseGrade === "PRE-KG") baseGrade = "PRE KG";

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

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage) || 1;
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-4">
      {/* Grade Filter Bar */}
      {!loading && !error && (
        <div className="flex items-center gap-3">
          <label htmlFor="grade-filter" className="text-sm font-medium text-gray-700 whitespace-nowrap">
            Filter by Grade:
          </label>
          <div className="w-full md:w-64">
            <Select value={selectedGrade} onValueChange={setSelectedGrade}>
              <SelectTrigger id="grade-filter" className="bg-white">
                <SelectValue placeholder="Select Grade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Students</SelectItem>
                {availableGrades.map((grade) => (
                  <SelectItem key={grade} value={grade}>
                    {grade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden w-full">
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <h3 className="text-nest-600 font-semibold italic whitespace-nowrap">
            STUDENTS DETAILS{" "}
            {selectedGrade !== "All" && (
              <span className="text-gray-400 text-sm font-normal">
                ({selectedGrade})
              </span>
            )}
          </h3>
          <div className="relative w-full md:w-auto">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={16}
            />
            <Input
              type="text"
              placeholder="Search by name or USN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full md:w-64 border-nest-300 focus:border-nest-500 rounded-lg"
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
            <table className="w-full table-fixed min-w-[600px]">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-4 py-3 w-[10%] text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    S.NO
                  </th>
                  <th className="px-4 py-3 w-[20%] text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    USN
                  </th>
                  <th className="px-4 py-3 w-[45%] text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    NAME
                  </th>
                  <th className="px-4 py-3 w-[25%] text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    GRADE
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedStudents.length > 0 ? (
                  paginatedStudents.map((student, index) => (
                    <tr
                      key={student.id}
                      className="hover:bg-nest-50/30 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm font-medium text-gray-500">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                        {student.usnNumber}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 truncate max-w-[280px]">
                        {student.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium">
                          {student.grade}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-12 text-center text-gray-500 italic"
                    >
                      No students found matching your criteria
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
          
          {/* Pagination Controls */}
          {!loading && !error && filteredStudents.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50 gap-4">
              <div className="text-sm text-gray-500">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredStudents.length)} of {filteredStudents.length} entries
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded border border-gray-200 bg-white text-sm disabled:opacity-50 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Previous
                </button>
                <div className="text-sm font-medium text-gray-700 px-2">
                  Page {currentPage} of {totalPages}
                </div>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 rounded border border-gray-200 bg-white text-sm disabled:opacity-50 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
