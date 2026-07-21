"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import {
  collection,
  query,
  where,
  Timestamp,
  onSnapshot,
  getCountFromServer,
  getDocs,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase-client";
import { useDate } from "@/contexts/date-context";
import { useStudentsContext, CachedStudent } from "@/contexts/students-context";
import { normalizeGrade, calculateSegment } from "@/lib/file-parser";

export interface LogDetail {
  usn: string;
  name: string;
  timestamp: Date;
  type: string;
  grade: string;
}

interface DashboardDataContextType {
  // Metrics
  totalStudents: number;
  studentsEntry: number;
  studentExit: number;
  entryLogs: LogDetail[];
  exitLogs: LogDetail[];
  // Grade attendance
  gradeAttendance: any[];
  // State
  loading: boolean;
  lastUpdated: Date | null;
  refreshMetrics: () => void;
}

const DashboardDataContext = createContext<DashboardDataContextType | undefined>(
  undefined,
);

export function DashboardDataProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { selectedDate, isToday } = useDate();
  const { students, invalidateStudentsCache } = useStudentsContext();

  const [totalStudents, setTotalStudents] = useState(0);
  const [studentsEntry, setStudentsEntry] = useState(0);
  const [studentExit, setStudentExit] = useState(0);
  const [entryLogs, setEntryLogs] = useState<LogDetail[]>([]);
  const [exitLogs, setExitLogs] = useState<LogDetail[]>([]);
  const [gradeAttendance, setGradeAttendance] = useState<
    GradeAttendanceData[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const unsubscribeRef = useRef<Unsubscribe | null>(null);
  // Fix 1: Use a ref for students to decouple subscribe() from students identity changes
  const studentsRef = useRef(students);
  studentsRef.current = students;
  // Fix 5: Maintain a local map of logs for incremental processing
  const logsMapRef = useRef<Map<string, { usn: string; type: string; timestamp: Timestamp }>>(new Map());

  // Grade sort order
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
    "G11",
    "G12",
    "AS LEVEL",
    "A LEVEL",
  ];

  // Process attendance logs against cached students to produce all metrics
  const processLogs = useCallback(
    (
      logs: Array<{
        usn: string;
        type: string;
        timestamp: Timestamp;
      }>,
      cachedStudents: CachedStudent[],
    ) => {
      // --- Dashboard metrics: count entries/exits ---
      let entryCount = 0;
      let exitCount = 0;
      const newEntryLogs: LogDetail[] = [];
      const newExitLogs: LogDetail[] = [];
      
      // Build a lookup map for students by USN and ID for O(1) access
      const studentById = new Map<string, CachedStudent>();
      cachedStudents.forEach((s) => {
        if (s.usn) studentById.set(s.usn, s);
        if (s.id) studentById.set(s.id, s);
      });

      logs.forEach((log) => {
        const student = studentById.get(log.usn);
        const name = student ? student.name : "Unknown Student";
        const detail: LogDetail = {
          usn: log.usn,
          name,
          timestamp: log.timestamp.toDate(),
          type: log.type,
          grade: student?.grade || "Unknown",
        };

        if (log.type === "ENTRY") {
          entryCount++;
          newEntryLogs.push(detail);
        } else if (log.type === "EXIT") {
          exitCount++;
          newExitLogs.push(detail);
        }
      });
      
      // Sort logs descending by timestamp
      newEntryLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      newExitLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      setStudentsEntry(entryCount);
      setStudentExit(exitCount);
      setEntryLogs(newEntryLogs);
      setExitLogs(newExitLogs);

      // --- Grade-wise attendance ---
      // Build grade strength map from cached students
      const gradeMap: Record<
        string,
        { strength: number; presentUSNs: Set<string> }
      > = {};
      cachedStudents.forEach((s) => {
        // Normalize the grade (e.g. "3A" -> "G3", "PRE KG A" -> "PREKG")
        // If normalization fails, fallback to the raw grade
        const baseGrade = normalizeGrade(s.grade) || s.grade || "Unknown";
        
        if (baseGrade === "Unknown") {
          console.log("⚠️ Student with Unknown/Empty grade:", s.name, s.usn, s.grade);
        }

        if (!gradeMap[baseGrade]) {
          gradeMap[baseGrade] = { strength: 0, presentUSNs: new Set() };
        }
        gradeMap[baseGrade].strength += 1;
      });

      // Determine each student's latest action
      const studentStatus: Record<
        string,
        { lastAction: string; timestamp: Timestamp }
      > = {};
      logs.forEach((log) => {
        if (!log.usn || !log.type || !log.timestamp) return;
        if (
          !studentStatus[log.usn] ||
          log.timestamp.toMillis() >
            studentStatus[log.usn].timestamp.toMillis()
        ) {
          studentStatus[log.usn] = {
            lastAction: log.type,
            timestamp: log.timestamp,
          };
        }
      });

      // Mark present students (last action = ENTRY)

      Object.entries(studentStatus).forEach(([usn, status]) => {
        if (status.lastAction === "ENTRY") {
          const student = studentById.get(usn);
          if (student) {
            const baseGrade = normalizeGrade(student.grade) || student.grade || "Unknown";
            if (gradeMap[baseGrade]) {
              gradeMap[baseGrade].presentUSNs.add(usn);
            }
          }
        }
      });

      // Convert to sorted array
      const gradeArr = Object.entries(gradeMap).map(([grade, data]) => ({
        grade,
        strength: data.strength,
        present: data.presentUSNs.size,
      }));
      gradeArr.sort((a, b) => {
        const indexA = gradeOrder.indexOf(a.grade);
        const indexB = gradeOrder.indexOf(b.grade);
        if (indexA === -1 && indexB === -1)
          return a.grade.localeCompare(b.grade);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      });
      setGradeAttendance(gradeArr);

      setLastUpdated(new Date());
      setLoading(false);
    },
    [],
  );

  // Subscribe to attendance_logs with onSnapshot
  const subscribe = useCallback(() => {
    // Unsubscribe from any previous listener
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    // Fix 5: Clear incremental logs map on re-subscribe (date changed)
    logsMapRef.current.clear();

    setLoading(true);

    // Fetch total student count (1 aggregation read — NOT a full scan)
    const studentsCollection = collection(db, "students");
    getCountFromServer(studentsCollection)
      .then((snap) => setTotalStudents(snap.data().count))
      .catch(() => setTotalStudents(studentsRef.current.length));

    // Build date range for query
    const queryDate = selectedDate;
    const startOfDay = new Date(queryDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(queryDate);
    endOfDay.setHours(23, 59, 59, 999);

    const logsCollection = collection(db, "attendance_logs");
    const q = query(
      logsCollection,
      where("timestamp", ">=", Timestamp.fromDate(startOfDay)),
      where("timestamp", "<=", Timestamp.fromDate(endOfDay)),
    );

    if (isToday) {
      // Fix 5: Real-time listener using incremental docChanges()
      const unsub = onSnapshot(
        q,
        (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            const data = change.doc.data();
            const logEntry = {
              usn: data.usn,
              type: data.type,
              timestamp: data.timestamp as Timestamp,
            };
            if (change.type === "added" || change.type === "modified") {
              logsMapRef.current.set(change.doc.id, logEntry);
            } else if (change.type === "removed") {
              logsMapRef.current.delete(change.doc.id);
            }
          });
          const logs = Array.from(logsMapRef.current.values());
          processLogs(logs, studentsRef.current);
        },
        (error) => {
          console.error("Attendance snapshot error:", error);
          setLoading(false);
        },
      );
      unsubscribeRef.current = unsub;
    } else {
      // Fix 4: Historical date — check localStorage cache first
      const dateStr = `${startOfDay.getFullYear()}-${String(startOfDay.getMonth() + 1).padStart(2, "0")}-${String(startOfDay.getDate()).padStart(2, "0")}`;
      const cacheKey = `attendance_logs_${dateStr}`;
      const HISTORICAL_LOGS_TTL = 24 * 60 * 60 * 1000; // 24 hours

      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < HISTORICAL_LOGS_TTL) {
            const logs = data.map((log: { usn: string; type: string; timestamp: { seconds: number; nanoseconds: number } }) => ({
              usn: log.usn,
              type: log.type,
              timestamp: new Timestamp(log.timestamp.seconds, log.timestamp.nanoseconds),
            }));
            processLogs(logs, studentsRef.current);
            return; // Skip Firestore entirely
          }
        }
      } catch {
        // Corrupted cache — continue to Firestore
      }

      // One-shot fetch using getDocs (simpler than onSnapshot + immediate unsub)
      getDocs(q)
        .then((snapshot) => {
          const logs: Array<{ usn: string; type: string; timestamp: Timestamp }> = [];
          const cacheData: Array<{ usn: string; type: string; timestamp: { seconds: number; nanoseconds: number } }> = [];

          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const ts = data.timestamp as Timestamp;
            logs.push({ usn: data.usn, type: data.type, timestamp: ts });
            cacheData.push({
              usn: data.usn,
              type: data.type,
              timestamp: { seconds: ts.seconds, nanoseconds: ts.nanoseconds },
            });
          });

          try {
            localStorage.setItem(cacheKey, JSON.stringify({ data: cacheData, timestamp: Date.now() }));
          } catch {
            // localStorage full — ignore
          }

          processLogs(logs, studentsRef.current);
        })
        .catch((error) => {
          console.error("Attendance fetch error:", error);
          setLoading(false);
        });
    }
  }, [selectedDate, isToday]); // Fix 1: students and processLogs REMOVED from deps

  // Fix 1: Only re-subscribe on date changes; gate on students being loaded
  const studentsLoaded = students.length > 0;
  useEffect(() => {
    if (!studentsLoaded) return;
    subscribe();

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [subscribe, studentsLoaded]);

  const refreshMetrics = useCallback(() => {
    invalidateStudentsCache();
    subscribe();
  }, [subscribe, invalidateStudentsCache]);

  return (
    <DashboardDataContext.Provider
      value={{
        totalStudents,
        studentsEntry,
        studentExit,
        entryLogs,
        exitLogs,
        gradeAttendance,
        loading,
        lastUpdated,
        refreshMetrics,
      }}
    >
      {children}
    </DashboardDataContext.Provider>
  );
}

export function useDashboardData() {
  const context = useContext(DashboardDataContext);
  if (context === undefined) {
    throw new Error(
      "useDashboardData must be used within a DashboardDataProvider",
    );
  }
  return context;
}
