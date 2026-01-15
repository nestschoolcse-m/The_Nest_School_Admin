"use client"

import { useState } from "react"
import { Search } from "lucide-react"
import { students, type Student } from "@/lib/data"
import { Input } from "@/components/ui/input"

interface StudentTableProps {
  showTodayTransport?: boolean
  compact?: boolean
}

export function StudentTable({ showTodayTransport = false, compact = false }: StudentTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [data] = useState<Student[]>(students)

  const filteredStudents = data.filter(
    (student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.usnNumber.toLowerCase().includes(searchTerm.toLowerCase()),
  )

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
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.NO</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NAME</th>
              {!compact && (
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {showTodayTransport ? "USN NUMBER" : "ADMISSION NUMBER"}
                </th>
              )}
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GRADE</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SEC</th>
              {!compact && !showTodayTransport && (
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  GENDER
                </th>
              )}
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                MODE OF TRANSPORT {showTodayTransport ? "(DEFAULT)" : ""}
              </th>
              {showTodayTransport && (
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  MODE OF TRANSPORT (TODAY)
                </th>
              )}
              {!compact && !showTodayTransport && (
                <>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    USN NUMBER
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PARENT CARD
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    DATE OF BIRTH
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    BLOOD
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredStudents.map((student) => (
              <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-sm text-gray-900">{student.sno}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{student.name}</td>
                {!compact && (
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {showTodayTransport ? student.usnNumber : student.admissionNumber}
                  </td>
                )}
                <td className="px-4 py-3 text-sm text-gray-600">{student.grade}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{student.section}</td>
                {!compact && !showTodayTransport && (
                  <td className="px-4 py-3 text-sm text-gray-600">{student.gender}</td>
                )}
                <td className="px-4 py-3 text-sm text-gray-600">{student.modeOfTransport}</td>
                {showTodayTransport && (
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {student.todayTransport || student.modeOfTransport}
                  </td>
                )}
                {!compact && !showTodayTransport && (
                  <>
                    <td className="px-4 py-3 text-sm text-gray-600">{student.usnNumber}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{student.parentCard}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{student.dateOfBirth}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{student.bloodGroup}</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
