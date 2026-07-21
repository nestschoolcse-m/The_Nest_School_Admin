"use client";

import { useMemo } from "react";
import { useStudentsContext, CachedStudent } from "@/contexts/students-context";

// Re-export the student type for backwards compatibility
export type { CachedStudent };

export interface Student {
  id: string;
  usn: string;
  usnNumber: string;
  name: string;
  grade: string;
}

/**
 * Hook to fetch all students — backed by StudentsContext cache.
 * No Firestore reads are performed; data comes from the global cache.
 */
export const useStudents = () => {
  const { students, loading, error } = useStudentsContext();

  const mappedStudents: Student[] = useMemo(
    () =>
      students.map((s) => ({
        id: s.id,
        usn: s.usn,
        usnNumber: s.usnNumber,
        name: s.name,
        grade: s.grade,
      })),
    [students],
  );

  return { students: mappedStudents, loading, error };
};

/**
 * Hook to fetch students by grade — filters cached data, no Firestore reads.
 */
export const useStudentsByGrade = (grade: string) => {
  const { students, loading, error } = useStudentsContext();

  const filtered: Student[] = useMemo(() => {
    if (!grade) return [];
    return students
      .filter((s) => s.grade === grade)
      .map((s) => ({
        id: s.id,
        usn: s.usn,
        usnNumber: s.usnNumber,
        name: s.name,
        grade: s.grade,
      }));
  }, [students, grade]);

  return { students: filtered, loading, error };
};

/**
 * Hook to fetch students with filters — filters cached data, no Firestore reads.
 */
export const useStudentsWithFilters = (filters?: {
  grade?: string;
  name?: string;
}) => {
  const { students, loading, error } = useStudentsContext();

  const filtered: Student[] = useMemo(() => {
    let result = students.map((s) => ({
      id: s.id,
      usn: s.usn,
      usnNumber: s.usnNumber,
      name: s.name,
      grade: s.grade,
    }));

    if (filters?.grade) {
      result = result.filter((s) => s.grade === filters.grade);
    }
    if (filters?.name) {
      result = result.filter((s) =>
        s.name.toLowerCase().includes(filters.name!.toLowerCase()),
      );
    }

    return result;
  }, [students, filters?.grade, filters?.name]);

  return { students: filtered, loading, error };
};
