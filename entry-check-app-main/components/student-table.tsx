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
  const { students, loading, error } = useStudents();

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.usnNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-teal-600 font-semibold italic">
          {showTodayTransport ? "Tabular Column" : "STUDENTS DETAILS"}
        </h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-64 border-teal-300 focus:border-teal-500"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Spinner />
            <span className="ml-2 text-gray-600">Loading students...</span>
          </div>
        )}

        {error && (
          <div className="p-4 text-red-600 bg-red-50">
            Error loading students: {error}
          </div>
        )}

        {!loading && !error && (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  NAME
                </th>
                {!compact && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    USN NUMBER
                  </th>
                )}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  GRADE
                </th>
                {!compact && !showTodayTransport && (
                  <>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      DATE OF BIRTH
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      FATHER NAME
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      FATHER MOBILE
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      MOTHER NAME
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      MOTHER MOBILE
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <tr
                    key={student.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {student.name}
                    </td>
                    {!compact && (
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {student.usnNumber}
                      </td>
                    )}
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {student.grade}
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
                          {student.fatherMobile}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {student.motherName}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {student.motherMobile}
                        </td>
                      </>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={compact ? 2 : 8}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    No students found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
