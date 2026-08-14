"use client";

import { useState } from "react";
import { Home, Users, LogOut, RefreshCw, RotateCcw } from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { useDashboardData } from "@/contexts/dashboard-data-context";
import { useDate } from "@/contexts/date-context";
import { useEndDayReset } from "@/hooks/useEndDayReset";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function DashboardMetrics() {
  const { selectedDate, isToday } = useDate();
  const {
    totalStudents,
    studentsEntry,
    studentExit,
    loading,
    lastUpdated,
    refreshMetrics,
  } = useDashboardData();

  const { isResetting, executeReset, computeMismatches } = useEndDayReset();
  const [resetResult, setResetResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [showResultDialog, setShowResultDialog] = useState(false);

  // Pre-compute mismatches for the confirmation dialog preview
  const mismatches = isToday && !loading ? computeMismatches() : null;
  const missingExitCount = mismatches?.missingExits.length ?? 0;
  const missingEntryCount = mismatches?.missingEntries.length ?? 0;
  const hasOpenLoops = missingExitCount > 0 || missingEntryCount > 0;

  const handleReset = async () => {
    const result = await executeReset();
    setResetResult(result);
    setShowResultDialog(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-24 bg-gray-200 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-sm text-gray-500">
        <div className="flex items-center gap-4">
          <span>
            {selectedDate.toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
          {!isToday && (
            <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">
              Historical Data
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs hidden sm:inline">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={refreshMetrics}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1 rounded hover:bg-gray-100 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>

          {/* End Day Reset Button — only shown for today */}
          {isToday && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  disabled={isResetting || loading}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 hover:border-red-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                  <RotateCcw
                    size={15}
                    className={isResetting ? "animate-spin" : ""}
                  />
                  {isResetting ? "Resetting..." : "End Day Reset"}
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2 text-red-700">
                    <RotateCcw size={20} />
                    End of Day Reset
                  </AlertDialogTitle>
                  <AlertDialogDescription asChild>
                    <div className="space-y-3 text-sm text-gray-600">
                      <p>
                        This will close all open attendance loops for today.
                        Before making any changes, the daily attendance report
                        will be <strong>automatically downloaded as a PDF</strong>.
                      </p>

                      {hasOpenLoops ? (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2">
                          <p className="font-medium text-amber-800">
                            The following records will be created:
                          </p>
                          {missingExitCount > 0 && (
                            <div className="flex items-center gap-2 text-amber-700">
                              <LogOut size={14} />
                              <span>
                                <strong>{missingExitCount}</strong> EXIT log
                                {missingExitCount !== 1 ? "s" : ""} (students
                                still in school)
                              </span>
                            </div>
                          )}
                          {missingEntryCount > 0 && (
                            <div className="flex items-center gap-2 text-amber-700">
                              <Users size={14} />
                              <span>
                                <strong>{missingEntryCount}</strong> ENTRY log
                                {missingEntryCount !== 1 ? "s" : ""} (students
                                who exited without entry)
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <p className="text-green-700 font-medium">
                            ✓ All attendance records are already clean. No
                            changes needed.
                          </p>
                        </div>
                      )}

                      <p className="text-xs text-gray-500">
                        Students who were absent today (no entry and no exit)
                        will not be affected.
                      </p>
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleReset}
                    className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
                    disabled={isResetting}
                  >
                    {isResetting
                      ? "Processing..."
                      : hasOpenLoops
                        ? "Download Report & Reset"
                        : "Download Report Only"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      <div className="flex justify-center">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
          <StatCard
            icon={Home}
            label="Number of Students"
            value={totalStudents}
            iconClassName="text-nest-400"
            valueClassName="text-nest-700"
          />
          <StatCard
            icon={Users}
            label="Students Entry"
            value={studentsEntry}
            iconClassName="text-nest-500"
            valueClassName="text-nest-700"
            href="/logs?type=entry"
          />
          <StatCard
            icon={LogOut}
            label="Student Exit"
            value={studentExit}
            iconClassName="text-nest-600"
            valueClassName="text-nest-700"
            href="/logs?type=exit"
          />
        </div>
      </div>

      {/* Result Toast Dialog */}
      <AlertDialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {resetResult?.success ? "✓ Reset Complete" : "✗ Reset Failed"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {resetResult?.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowResultDialog(false)}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
