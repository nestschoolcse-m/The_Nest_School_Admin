"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase-client";

// --- Cache constants ---
const CACHE_KEY = "students_cache_v2";
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

export interface CachedStudent {
  id: string;
  usn: string;
  usnNumber: string;
  name: string;
  grade: string;
}

interface CacheEntry {
  data: CachedStudent[];
  timestamp: number;
}

interface StudentsContextType {
  students: CachedStudent[];
  loading: boolean;
  error: string | null;
  refreshStudents: () => Promise<void>;
  invalidateStudentsCache: () => void;
}

const StudentsContext = createContext<StudentsContextType | undefined>(undefined);

export function StudentsProvider({ children }: { children: React.ReactNode }) {
  const [students, setStudents] = useState<CachedStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  // Try to load from localStorage cache first
  const loadFromCache = (): CachedStudent[] | null => {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;

      const cache: CacheEntry = JSON.parse(raw);
      if (Date.now() - cache.timestamp > CACHE_TTL) {
        // Cache is stale
        localStorage.removeItem(CACHE_KEY);
        return null;
      }

      // Cache is plain JSON-compatible now — no rehydration needed
      return cache.data;
    } catch {
      // Corrupted cache — clear it
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
  };

  // Write current students list to localStorage
  const writeToCache = (studentsList: CachedStudent[]) => {
    try {
      const entry: CacheEntry = { data: studentsList, timestamp: Date.now() };
      localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
    } catch {
      console.warn("Failed to write students cache to localStorage");
    }
  };

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Check localStorage cache first
      const cached = loadFromCache();
      if (cached) {
        console.log(`[StudentsContext] Loaded ${cached.length} students from localStorage cache`);
        setStudents(cached);
        setLoading(false);
        return;
      }

      // 2. Cache miss — fetch from Firestore
      console.log("[StudentsContext] Cache miss — fetching students from Firestore");
      const studentsCollection = collection(db, "students");
      const snapshot = await getDocs(studentsCollection);

      const studentsList: CachedStudent[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        const section =
          data.section &&
          data.section !== "nil" &&
          data.section !== "N/A" &&
          data.section !== "NILL"
            ? data.section
            : "";
        let fullGrade = data.grade ? data.grade.trim() : "";
        if (section) {
          // Check if fullGrade already ends with a section identifier
          // Matches a single letter at the end, preceded by a space or a digit (e.g., "LKG A", "10A", "9 B")
          const hasSectionAlready = /(?:^|[ \d])[A-Za-z]$/i.test(fullGrade);
          
          if (!hasSectionAlready) {
            fullGrade = `${fullGrade} ${section}`;
          }
        }

        studentsList.push({
          id: doc.id,
          usn: data.usnNumber || data.usn || doc.id,
          usnNumber: data.usnNumber || data.usn || doc.id,
          name: data.name || "",
          grade: fullGrade,
        });
      });

      setStudents(studentsList);

      // 3. Write to cache for next reload
      writeToCache(studentsList);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch students");
    } finally {
      setLoading(false);
    }
  }, []);

  // Force-refresh: clears the cache and re-fetches from Firestore
  const invalidateStudentsCache = useCallback(() => {
    console.log("[StudentsContext] Cache invalidated — will re-fetch from Firestore");
    localStorage.removeItem(CACHE_KEY);
    hasFetched.current = false;
    fetchStudents();
  }, [fetchStudents]);

  // Load students once on mount (guarded for React 18 StrictMode)
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchStudents();
  }, [fetchStudents]);

  return (
    <StudentsContext.Provider
      value={{
        students,
        loading,
        error,
        refreshStudents: fetchStudents,
        invalidateStudentsCache,
      }}
    >
      {children}
    </StudentsContext.Provider>
  );
}

export function useStudentsContext() {
  const context = useContext(StudentsContext);
  if (context === undefined) {
    throw new Error("useStudentsContext must be used within a StudentsProvider");
  }
  return context;
}
