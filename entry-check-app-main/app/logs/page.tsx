"use client"

import { useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useDashboardData } from "@/contexts/dashboard-data-context"
import { useDate } from "@/contexts/date-context"
import { calculateSegment } from "@/lib/file-parser"
import { ArrowLeft, RefreshCw, Users, LogOut, Search, AlertCircle } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"

export default function LogsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const type = searchParams?.get("type")

  const { entryLogs, exitLogs, studentsEntry, studentExit, loading, refreshMetrics } = useDashboardData()
  const { selectedDate } = useDate()

  const isEntry = type === "entry"
  const logs = isEntry ? entryLogs : exitLogs
  const title = isEntry ? "Students Entry Details" : "Student Exit Details"
  const Icon = isEntry ? Users : LogOut

  const [searchQuery, setSearchQuery] = useState("")
  const [gradeFilter, setGradeFilter] = useState(searchParams?.get("grade") || "all")
  const [sortBy, setSortBy] = useState("timestamp")
  const [sortOrder, setSortOrder] = useState("asc")

  const [isMismatchesModalOpen, setIsMismatchesModalOpen] = useState(false)
  const [missingExits, setMissingExits] = useState<{usn: string, name: string, grade: string}[]>([])
  const [missingEntries, setMissingEntries] = useState<{usn: string, name: string, grade: string}[]>([])

  const [missingExitsPage, setMissingExitsPage] = useState(1)
  const [missingEntriesPage, setMissingEntriesPage] = useState(1)
  const ITEMS_PER_PAGE = 15

  const checkMismatches = () => {
    // 1. Missing Exits: Latest log today is ENTRY
    const latestLogs = new Map<string, typeof entryLogs[0]>();
    
    [...entryLogs, ...exitLogs].forEach(log => {
       const existing = latestLogs.get(log.usn);
       if (!existing || log.timestamp.getTime() > existing.timestamp.getTime()) {
           latestLogs.set(log.usn, log);
       }
    });

    const mExits = Array.from(latestLogs.values())
      .filter(log => log.type === "ENTRY")
      .map(log => ({ usn: log.usn, name: log.name, grade: log.grade }));
      
    // 2. Missing Entries: Has EXIT today, but no ENTRY today
    const entryUsns = new Set(entryLogs.map(l => l.usn));
    const mEntriesLogs = exitLogs.filter(log => !entryUsns.has(log.usn));
    const uniqueMissingEntries = new Map();
    mEntriesLogs.forEach(log => {
       if(!uniqueMissingEntries.has(log.usn)) {
          uniqueMissingEntries.set(log.usn, log);
       }
    });
    const mEntries = Array.from(uniqueMissingEntries.values())
      .map(log => ({ usn: log.usn, name: log.name, grade: log.grade }));
    
    setMissingExits(mExits);
    setMissingEntries(mEntries);
    setMissingExitsPage(1);
    setMissingEntriesPage(1);
    setIsMismatchesModalOpen(true);
  }

  const paginatedMissingExits = missingExits.slice((missingExitsPage - 1) * ITEMS_PER_PAGE, missingExitsPage * ITEMS_PER_PAGE);
  const totalExitsPages = Math.ceil(missingExits.length / ITEMS_PER_PAGE);

  const paginatedMissingEntries = missingEntries.slice((missingEntriesPage - 1) * ITEMS_PER_PAGE, missingEntriesPage * ITEMS_PER_PAGE);
  const totalEntriesPages = Math.ceil(missingEntries.length / ITEMS_PER_PAGE);

  const isGradeMatch = (grade: string, filter: string) => {
    if (filter === "all") return true;
    if (filter === "1-5") return ["G1", "G2", "G3", "G4", "G5"].includes(grade);
    if (filter === "PREKG-LKG") return ["PREKG", "LKG"].includes(grade);
    if (filter === "8-12") return ["G8", "G9", "G10", "G11", "G12"].includes(grade);
    
    // Check if the filter matches the exact grade
    if (grade === filter) return true;
    
    // Check if the filter matches the segment (e.g. "EYP", "PYP")
    if (calculateSegment(grade) === filter) return true;
    
    return false;
  }

  const filteredLogs = [...logs]
    .filter((log) => {
      const matchesSearch = 
        log.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.usn.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGrade = isGradeMatch(log.grade, gradeFilter);
      return matchesSearch && matchesGrade;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === "timestamp") {
        comparison = a.timestamp.getTime() - b.timestamp.getTime();
      } else if (sortBy === "grade") {
        comparison = a.grade.localeCompare(b.grade, undefined, { numeric: true });
      }
      return sortOrder === "asc" ? comparison : -comparison;
    })

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>
          <div className="flex items-center gap-2">
            <Icon className={`w-6 h-6 ${isEntry ? "text-gray-700" : "text-nest-500"}`} />
            <Select
              value={type || "entry"}
              onValueChange={(val) => router.push(`/logs?type=${val}`)}
            >
              <SelectTrigger className="w-[300px] text-2xl font-bold text-gray-800 border-none shadow-none bg-transparent hover:bg-gray-50 focus:ring-0 px-2 h-auto [&>span]:line-clamp-none">
                <SelectValue placeholder="Select details to view" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entry">Students Entry Details</SelectItem>
                <SelectItem value="exit">Student Exit Details</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span>
            {selectedDate.toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={checkMismatches}
            className="flex items-center gap-2 text-nest-600 border-nest-200 hover:bg-nest-50"
          >
            <AlertCircle size={16} />
            Check Mismatches
          </Button>
          <button
            onClick={refreshMetrics}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1 rounded hover:bg-white border border-transparent hover:border-gray-200 disabled:opacity-50 transition-colors"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <span className="font-medium text-gray-700">
            Total {isEntry ? "Entries" : "Exits"}: {filteredLogs.length}
          </span>
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <Select value={gradeFilter} onValueChange={setGradeFilter}>
              <SelectTrigger className="w-full sm:w-40 bg-white">
                <SelectValue placeholder="Filter by Grade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grades</SelectItem>
                <SelectItem value="PREKG-LKG">PREKG - LKG</SelectItem>
                <SelectItem value="1-5">Grades 1-5</SelectItem>
                <SelectItem value="8-12">Grades 8-12</SelectItem>
                {gradeFilter !== "all" && !["PREKG-LKG", "1-5", "8-12"].includes(gradeFilter) && (
                  <SelectItem value={gradeFilter}>{gradeFilter}</SelectItem>
                )}
              </SelectContent>
            </Select>
            <Select value={`${sortBy}-${sortOrder}`} onValueChange={(val) => {
              const [by, order] = val.split('-');
              setSortBy(by);
              setSortOrder(order);
            }}>
              <SelectTrigger className="w-full sm:w-48 bg-white">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="timestamp-asc">Time (Earliest First)</SelectItem>
                <SelectItem value="timestamp-desc">Time (Latest First)</SelectItem>
                <SelectItem value="grade-asc">Grade (A-Z)</SelectItem>
                <SelectItem value="grade-desc">Grade (Z-A)</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input 
                placeholder="Search by name or USN..." 
                className="pl-9 bg-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
        
        {loading ? (
          <div className="p-12 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nest-600"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            No {isEntry ? "entry" : "exit"} logs found for this date.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>USN</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log, index) => (
                <TableRow key={`${log.usn}-${index}`}>
                  <TableCell className="font-medium">{log.usn}</TableCell>
                  <TableCell>{log.name}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                      {log.grade}
                    </span>
                  </TableCell>
                  <TableCell>
                    {log.timestamp.toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                      second: "2-digit",
                      hour12: true,
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={isMismatchesModalOpen} onOpenChange={setIsMismatchesModalOpen}>
        <DialogContent className="max-w-5xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Log Mismatches Today</DialogTitle>
          </DialogHeader>
          
          <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4 mt-2 mb-2 flex justify-around items-center">
            <div className="text-center">
              <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-1">Entries</p>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-2xl font-bold text-gray-800">{studentsEntry}</span>
                <span className="text-sm text-gray-500">→ {studentsEntry + missingEntries.length} (Projected)</span>
              </div>
            </div>
            <div className="w-px h-10 bg-blue-200"></div>
            <div className="text-center">
              <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-1">Exits</p>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-2xl font-bold text-gray-800">{studentExit}</span>
                <span className="text-sm text-gray-500">→ {studentExit + missingExits.length} (Projected)</span>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto mt-2 pr-2">
            <Tabs defaultValue="missing-exits" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="missing-exits">Missing Exits ({missingExits.length})</TabsTrigger>
                <TabsTrigger value="missing-entries">Missing Entries ({missingEntries.length})</TabsTrigger>
              </TabsList>
              
              <TabsContent value="missing-exits" className="flex flex-col min-h-[400px]">
                {missingExits.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">All students who entered today have exited.</p>
                ) : (
                  <div className="flex flex-col flex-1">
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
                        {paginatedMissingExits.map((student, idx) => (
                          <TableRow key={`missing-exit-${student.usn}-${idx}`}>
                            <TableCell className="text-gray-500">{(missingExitsPage - 1) * ITEMS_PER_PAGE + idx + 1}</TableCell>
                            <TableCell className="font-medium">{student.usn}</TableCell>
                            <TableCell>{student.name}</TableCell>
                            <TableCell>{student.grade}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    
                    {totalExitsPages > 1 && (
                      <div className="mt-auto pt-4">
                        <Pagination>
                          <PaginationContent>
                            <PaginationItem>
                              <PaginationPrevious 
                                href="#" 
                                onClick={(e) => { e.preventDefault(); setMissingExitsPage(p => Math.max(1, p - 1)) }}
                                className={missingExitsPage <= 1 ? "pointer-events-none opacity-50" : ""}
                              />
                            </PaginationItem>
                            <PaginationItem>
                              <span className="px-4 text-sm text-gray-500">Page {missingExitsPage} of {totalExitsPages}</span>
                            </PaginationItem>
                            <PaginationItem>
                              <PaginationNext 
                                href="#" 
                                onClick={(e) => { e.preventDefault(); setMissingExitsPage(p => Math.min(totalExitsPages, p + 1)) }}
                                className={missingExitsPage >= totalExitsPages ? "pointer-events-none opacity-50" : ""}
                              />
                            </PaginationItem>
                          </PaginationContent>
                        </Pagination>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="missing-entries" className="flex flex-col min-h-[400px]">
                {missingEntries.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No students exited without an entry log today.</p>
                ) : (
                  <div className="flex flex-col flex-1">
                    <p className="text-sm text-gray-500 mb-4">These students scanned out today, but there is no record of them entering today (they may have entered on a previous day or missed scanning).</p>
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
                        {paginatedMissingEntries.map((student, idx) => (
                          <TableRow key={`missing-entry-${student.usn}-${idx}`}>
                            <TableCell className="text-gray-500">{(missingEntriesPage - 1) * ITEMS_PER_PAGE + idx + 1}</TableCell>
                            <TableCell className="font-medium">{student.usn}</TableCell>
                            <TableCell>{student.name}</TableCell>
                            <TableCell>{student.grade}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    
                    {totalEntriesPages > 1 && (
                      <div className="mt-auto pt-4">
                        <Pagination>
                          <PaginationContent>
                            <PaginationItem>
                              <PaginationPrevious 
                                href="#" 
                                onClick={(e) => { e.preventDefault(); setMissingEntriesPage(p => Math.max(1, p - 1)) }}
                                className={missingEntriesPage <= 1 ? "pointer-events-none opacity-50" : ""}
                              />
                            </PaginationItem>
                            <PaginationItem>
                              <span className="px-4 text-sm text-gray-500">Page {missingEntriesPage} of {totalEntriesPages}</span>
                            </PaginationItem>
                            <PaginationItem>
                              <PaginationNext 
                                href="#" 
                                onClick={(e) => { e.preventDefault(); setMissingEntriesPage(p => Math.min(totalEntriesPages, p + 1)) }}
                                className={missingEntriesPage >= totalEntriesPages ? "pointer-events-none opacity-50" : ""}
                              />
                            </PaginationItem>
                          </PaginationContent>
                        </Pagination>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
