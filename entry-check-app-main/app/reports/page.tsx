"use client"
import { useState, useMemo } from "react"
import { FileText, Download, RefreshCw, Calendar as CalendarIcon } from "lucide-react"
import { useDashboardData } from "@/contexts/dashboard-data-context"
import { useStudentsContext } from "@/contexts/students-context"
import { useDate } from "@/contexts/date-context"
import { exportReportToPDF } from "@/lib/pdf-export"
import { normalizeGrade, compareGrades } from "@/lib/file-parser"
import { CalendarWidget } from "@/components/calendar-widget"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export default function ReportsPage() {
  const { students } = useStudentsContext()
  const { entryLogs, exitLogs, loading, refreshMetrics } = useDashboardData()
  const { selectedDate } = useDate()

  const [reportType, setReportType] = useState("whole") // 'whole', 'grade', 'segment'
  const [filterValue, setFilterValue] = useState("all")
  
  const [activeTab, setActiveTab] = useState("absent")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  // Reset filter when type changes
  const handleTypeChange = (val: string) => {
    setReportType(val)
    setFilterValue("all")
  }

  const getPaginated = (list: any[]) => list.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  
  const getPaginationUI = (list: any[]) => {
    const totalItems = list.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    const start = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const end = Math.min(currentPage * itemsPerPage, totalItems);
    
    return (
      <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-4 text-sm text-gray-500">
        <div>
          Showing {start} to {end} of {totalItems} entries
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <div className="px-3 py-1 font-medium text-gray-700 bg-gray-50 rounded border border-gray-100">
            Page {currentPage} of {totalPages}
          </div>
          <button 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    );
  }

  // Helper to determine if a grade is in a segment
  const isInSegment = (grade: string, segment: string) => {
    const segments = {
      "EYP": ["PREKG", "PRE KG", "LKG", "UKG"],
      "PYP": ["G1", "G2", "G3", "G4", "G5"],
      "CIE LS": ["G6", "G7", "G8"],
      "CIE US": ["G9", "G10"],
      "CIE SS": ["G11", "G12"]
    }
    return segments[segment as keyof typeof segments]?.includes(grade)
  }

  // Generate unique grades for dropdown
  const uniqueGrades = useMemo(() => {
    const grades = new Set(students.map(s => {
      const normalized = normalizeGrade(s.grade);
      return normalized || s.grade?.split(" ")[0] || "Unknown";
    }))
    return Array.from(grades).sort(compareGrades)
  }, [students])

  // Derive target students
  const targetStudents = useMemo(() => {
    return students.filter(student => {
      const normalized = normalizeGrade(student.grade);
      const g = normalized || student.grade?.split(" ")[0] || "Unknown" // Strip sections if any
      if (reportType === "whole") return true
      if (reportType === "grade") return filterValue === "all" || g === filterValue
      if (reportType === "segment") return filterValue === "all" || isInSegment(g, filterValue)
      return true
    })
  }, [students, reportType, filterValue])

  const totalStudents = targetStudents.length
  
  // Compute metrics
  const targetUsns = new Set(targetStudents.map(s => s.usn))
  
  const targetEntryLogs = entryLogs.filter(log => targetUsns.has(log.usn));
  const targetExitLogs = exitLogs.filter(log => targetUsns.has(log.usn));

  const entriesInTarget = targetEntryLogs.length
  const exitsInTarget = targetExitLogs.length
  
  const entryUsns = new Set(targetEntryLogs.map(log => log.usn))
  const exitUsns = new Set(targetExitLogs.map(log => log.usn))
  
  // Absent = No entry AND No exit today
  const absentStudents = targetStudents.filter(student => !entryUsns.has(student.usn) && !exitUsns.has(student.usn))
  const absentCount = absentStudents.length

  // 1. Missing Exits: Latest log today is ENTRY
  const latestLogs = new Map<string, typeof entryLogs[0]>();
  [...targetEntryLogs, ...targetExitLogs].forEach(log => {
      const existing = latestLogs.get(log.usn);
      if (!existing || log.timestamp.getTime() > existing.timestamp.getTime()) {
          latestLogs.set(log.usn, log);
      }
  });

  const missingExits = Array.from(latestLogs.values())
    .filter(log => log.type === "ENTRY")
    .map(log => ({ usn: log.usn, name: log.name, grade: log.grade }));

  // 2. Missing Entries: Has EXIT today, but no ENTRY today
  const mEntriesLogs = targetExitLogs.filter(log => !entryUsns.has(log.usn));
  const uniqueMissingEntries = new Map();
  mEntriesLogs.forEach(log => {
      if(!uniqueMissingEntries.has(log.usn)) {
        uniqueMissingEntries.set(log.usn, log);
      }
  });
  const missingEntries = Array.from(uniqueMissingEntries.values())
    .map(log => ({ usn: log.usn, name: log.name, grade: log.grade }));

  const projectedEntries = entriesInTarget + missingEntries.length;
  const projectedExits = exitsInTarget + missingExits.length;

  const handleDownload = () => {
    let filterLabel = "Whole School"
    if (reportType === "grade") filterLabel = `Grade`
    if (reportType === "segment") filterLabel = `Segment`
    exportReportToPDF(selectedDate, filterLabel, filterValue === "all" ? "" : filterValue, totalStudents, entriesInTarget, exitsInTarget, absentCount, absentStudents, missingExits, missingEntries)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Top Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 flex items-center gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-sm font-medium text-gray-700 shadow-sm transition-colors">
                <CalendarIcon size={16} className="text-nest-600" />
                {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="w-[300px]">
                <CalendarWidget />
              </div>
            </PopoverContent>
          </Popover>
          <p className="text-gray-500 text-sm hidden md:block">
            Select a date to generate attendance reports
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={refreshMetrics}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 transition-colors text-sm font-medium"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh Data
          </button>
          
          <button
            onClick={handleDownload}
            disabled={loading || totalStudents === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-nest-600 text-white hover:bg-nest-700 disabled:opacity-50 transition-colors text-sm font-medium shadow-sm"
          >
            <Download size={16} />
            Download PDF
          </button>
        </div>
      </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex flex-col w-full sm:w-64">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Report Level</label>
              <Select value={reportType} onValueChange={handleTypeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="whole">Whole School</SelectItem>
                  <SelectItem value="grade">By Grade</SelectItem>
                  <SelectItem value="segment">By Segment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {reportType === "grade" && (
              <div className="flex flex-col w-full sm:w-64">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Select Grade</label>
                <Select value={filterValue} onValueChange={setFilterValue}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Grades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Grades</SelectItem>
                    {uniqueGrades.map(g => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {reportType === "segment" && (
              <div className="flex flex-col w-full sm:w-64">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Select Segment</label>
                <Select value={filterValue} onValueChange={setFilterValue}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Segments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Segments</SelectItem>
                    <SelectItem value="EYP">EYP (PreKG - UKG)</SelectItem>
                    <SelectItem value="PYP">PYP (Grades 1-5)</SelectItem>
                    <SelectItem value="CIE LS">CIE LS (Grades 6-8)</SelectItem>
                    <SelectItem value="CIE US">CIE US (Grades 9-10)</SelectItem>
                    <SelectItem value="CIE SS">CIE SS (Grades 11-12)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
              <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Students</span>
              <span className="text-3xl font-bold text-gray-800 mt-2">{totalStudents}</span>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
              <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Entries</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-bold text-nest-600">{entriesInTarget}</span>
                <span className="text-sm text-gray-500">→ {projectedEntries}</span>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
              <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Exits</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-bold text-orange-600">{exitsInTarget}</span>
                <span className="text-sm text-gray-500">→ {projectedExits}</span>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
              <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">Absent Count</span>
              <span className="text-3xl font-bold text-red-600 mt-2">{absentCount}</span>
            </div>
          </div>

      {/* Bottom Section: Full Width Tables */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden p-4">
        {loading ? (
          <div className="p-12 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nest-600"></div>
          </div>
        ) : (
          <Tabs 
            value={activeTab} 
            onValueChange={(val) => {
              setActiveTab(val);
              setCurrentPage(1);
            }} 
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="absent">Absent Students ({absentCount})</TabsTrigger>
              <TabsTrigger value="missing-exits">Missing Exits ({missingExits.length})</TabsTrigger>
              <TabsTrigger value="missing-entries">Missing Entries ({missingEntries.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="absent">
              {absentCount === 0 ? (
                <div className="p-12 text-center text-gray-500">No absent students found in this selection.</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">S.No</TableHead>
                        <TableHead>USN</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Grade</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getPaginated(absentStudents).map((student: any, idx: number) => (
                        <TableRow key={student.usn}>
                          <TableCell className="text-gray-500">
                            {(currentPage - 1) * itemsPerPage + idx + 1}
                          </TableCell>
                          <TableCell className="font-medium">{student.usn}</TableCell>
                          <TableCell className="whitespace-nowrap">{student.name}</TableCell>
                          <TableCell>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 whitespace-nowrap">
                              {student.grade || "N/A"}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {getPaginationUI(absentStudents)}
                </div>
              )}
            </TabsContent>

            <TabsContent value="missing-exits">
              {missingExits.length === 0 ? (
                <div className="p-12 text-center text-gray-500">No students missing exit logs.</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">S.No</TableHead>
                        <TableHead>USN</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Grade</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getPaginated(missingExits).map((student: any, idx: number) => (
                        <TableRow key={`me-${student.usn}-${idx}`}>
                          <TableCell className="text-gray-500">
                            {(currentPage - 1) * itemsPerPage + idx + 1}
                          </TableCell>
                          <TableCell className="font-medium">{student.usn}</TableCell>
                          <TableCell className="whitespace-nowrap">{student.name}</TableCell>
                          <TableCell>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 whitespace-nowrap">
                              {student.grade || "N/A"}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {getPaginationUI(missingExits)}
                </div>
              )}
            </TabsContent>

            <TabsContent value="missing-entries">
              {missingEntries.length === 0 ? (
                <div className="p-12 text-center text-gray-500">No students missing entry logs.</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">S.No</TableHead>
                        <TableHead>USN</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Grade</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getPaginated(missingEntries).map((student: any, idx: number) => (
                        <TableRow key={`men-${student.usn}-${idx}`}>
                          <TableCell className="text-gray-500">
                            {(currentPage - 1) * itemsPerPage + idx + 1}
                          </TableCell>
                          <TableCell className="font-medium">{student.usn}</TableCell>
                          <TableCell className="whitespace-nowrap">{student.name}</TableCell>
                          <TableCell>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 whitespace-nowrap">
                              {student.grade || "N/A"}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {getPaginationUI(missingEntries)}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}