"use client";

import { useState, useCallback } from "react";
import {
  collection,
  writeBatch,
  doc,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase-client";
import { useDashboardData, LogDetail } from "@/contexts/dashboard-data-context";
import { useStudentsContext, CachedStudent } from "@/contexts/students-context";
import { useDate } from "@/contexts/date-context";
import { exportReportToPDF } from "@/lib/pdf-export";

interface EndDayResetResult {
  success: boolean;
  message: string;
  exitsFilled: number;
  entriesFilled: number;
}

export function useEndDayReset() {
  const [isResetting, setIsResetting] = useState(false);
  const { students } = useStudentsContext();
  const {
    entryLogs,
    exitLogs,
    totalStudents,
    studentsEntry,
    studentExit,
    refreshMetrics,
  } = useDashboardData();
  const { selectedDate, isToday } = useDate();

  /**
   * Compute missing exits and missing entries from current logs.
   * This mirrors the exact logic used in the Reports page.
   */
  const computeMismatches = useCallback(() => {
    const entryUsns = new Set(entryLogs.map((l) => l.usn));
    const exitUsns = new Set(exitLogs.map((l) => l.usn));

    // Absent = no entry AND no exit today — leave these alone
    const absentStudents = students.filter(
      (s) => !entryUsns.has(s.usn) && !exitUsns.has(s.usn)
    );

    // Missing Exits: Latest log today is ENTRY (student is still in school)
    const latestLogs = new Map<string, LogDetail>();
    [...entryLogs, ...exitLogs].forEach((log) => {
      const existing = latestLogs.get(log.usn);
      if (
        !existing ||
        log.timestamp.getTime() > existing.timestamp.getTime()
      ) {
        latestLogs.set(log.usn, log);
      }
    });

    const missingExits = Array.from(latestLogs.values())
      .filter((log) => log.type === "ENTRY")
      .map((log) => ({ usn: log.usn, name: log.name, grade: log.grade }));

    // Missing Entries: Has EXIT today, but no ENTRY today
    const mEntriesLogs = exitLogs.filter((log) => !entryUsns.has(log.usn));
    const uniqueMissingEntries = new Map<string, LogDetail>();
    mEntriesLogs.forEach((log) => {
      if (!uniqueMissingEntries.has(log.usn)) {
        uniqueMissingEntries.set(log.usn, log);
      }
    });
    const missingEntries = Array.from(uniqueMissingEntries.values()).map(
      (log) => ({ usn: log.usn, name: log.name, grade: log.grade })
    );

    return { absentStudents, missingExits, missingEntries };
  }, [entryLogs, exitLogs, students]);

  /**
   * Execute the end-of-day reset:
   * 1. Generate and download the daily PDF report (before any changes)
   * 2. Batch-write missing EXIT logs for students whose last action is ENTRY
   * 3. Batch-write missing ENTRY logs for students who exited without entering
   * 4. Refresh dashboard metrics
   */
  const executeReset = useCallback(async (): Promise<EndDayResetResult> => {
    if (!isToday) {
      return {
        success: false,
        message: "End-of-day reset can only be run for today's date.",
        exitsFilled: 0,
        entriesFilled: 0,
      };
    }

    setIsResetting(true);

    try {
      const { absentStudents, missingExits, missingEntries } =
        computeMismatches();

      // --- Step 1: Generate the PDF report BEFORE making any changes ---
      try {
        await exportReportToPDF(
          selectedDate,
          "Whole School",
          "",
          totalStudents,
          studentsEntry,
          studentExit,
          absentStudents.length,
          absentStudents as CachedStudent[],
          missingExits,
          missingEntries
        );
      } catch (pdfError) {
        console.error("PDF generation failed, but continuing with reset:", pdfError);
        // Don't abort the reset if PDF fails — the user can re-download from Reports
      }

      // --- Step 2: Nothing to do? ---
      if (missingExits.length === 0 && missingEntries.length === 0) {
        setIsResetting(false);
        return {
          success: true,
          message: "All attendance records are already clean. No changes needed.",
          exitsFilled: 0,
          entriesFilled: 0,
        };
      }

      // --- Step 3: Batch-write the missing logs ---
      const now = new Date();
      // Use 11:59 PM today as the reset timestamp so it appears at end of day
      const resetTimestamp = new Date(selectedDate);
      resetTimestamp.setHours(23, 59, 0, 0);
      const firestoreTimestamp = Timestamp.fromDate(resetTimestamp);

      const logsCollection = collection(db, "attendance_logs");
      const batchSize = 500;
      const allWrites: Array<{ usn: string; type: string }> = [];

      // Missing exits → create EXIT logs
      missingExits.forEach((student) => {
        allWrites.push({ usn: student.usn, type: "EXIT" });
      });

      // Missing entries → create ENTRY logs
      missingEntries.forEach((student) => {
        allWrites.push({ usn: student.usn, type: "ENTRY" });
      });

      // Execute in batches of 500
      const batchPromises: Promise<void>[] = [];
      for (let i = 0; i < allWrites.length; i += batchSize) {
        const batch = writeBatch(db);
        const chunk = allWrites.slice(i, i + batchSize);

        chunk.forEach((write) => {
          const docRef = doc(logsCollection); // auto-generated ID
          batch.set(docRef, {
            usn: write.usn,
            type: write.type,
            timestamp: firestoreTimestamp,
          });
        });

        batchPromises.push(batch.commit());
      }

      await Promise.all(batchPromises);

      // --- Step 4: Refresh the dashboard to reflect new data ---
      refreshMetrics();

      setIsResetting(false);
      return {
        success: true,
        message: `End-of-day reset complete! Created ${missingExits.length} exit(s) and ${missingEntries.length} entry(ies).`,
        exitsFilled: missingExits.length,
        entriesFilled: missingEntries.length,
      };
    } catch (error) {
      setIsResetting(false);
      return {
        success: false,
        message: `Reset failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        exitsFilled: 0,
        entriesFilled: 0,
      };
    }
  }, [
    isToday,
    computeMismatches,
    selectedDate,
    totalStudents,
    studentsEntry,
    studentExit,
    refreshMetrics,
  ]);

  return {
    isResetting,
    executeReset,
    computeMismatches,
  };
}
