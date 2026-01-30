"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  QueryConstraint,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase-client";

export interface FirebaseStudent {
  usn: string;
  name: string;
  dob: string;
  grade: string;
  fatherName: string;
  fatherMobile: number;
  motherName: string;
  motherMobile: number;
  createdAt: Timestamp | null;
}

export interface Student extends FirebaseStudent {
  id: string;
  usnNumber: string;
}

// Hook to fetch all students
export const useStudents = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);

        const studentsCollection = collection(db, "students");
        const snapshot = await getDocs(studentsCollection);


        const studentsList: Student[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data() as FirebaseStudent;
          studentsList.push({
            ...data,
            id: doc.id,
            usn: doc.id,
            usnNumber: doc.id,
          });
        });

        setStudents(studentsList);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch students"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  return { students, loading, error };
};

// Hook to fetch students by grade
export const useStudentsByGrade = (grade: string) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!grade) {
      setStudents([]);
      setLoading(false);
      return;
    }

    const fetchStudents = async () => {
      try {
        setLoading(true);
        const studentsCollection = collection(db, "students");
        const q = query(studentsCollection, where("grade", "==", grade));
        const snapshot = await getDocs(q);

        const studentsList: Student[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data() as FirebaseStudent;
          studentsList.push({
            ...data,
            id: doc.id,
            usn: doc.id,
            usnNumber: doc.id,
          });
        });

        setStudents(studentsList);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch students"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [grade]);

  return { students, loading, error };
};

// Hook to fetch students with filters
export const useStudentsWithFilters = (filters?: {
  grade?: string;
  name?: string;
}) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const studentsCollection = collection(db, "students");
        const constraints: QueryConstraint[] = [];

        if (filters?.grade) {
          constraints.push(where("grade", "==", filters.grade));
        }

        const q =
          constraints.length > 0
            ? query(studentsCollection, ...constraints)
            : query(studentsCollection);
        const snapshot = await getDocs(q);

        let studentsList: Student[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data() as FirebaseStudent;
          studentsList.push({
            ...data,
            id: doc.id,
            usn: doc.id,
            usnNumber: doc.id,
          });
        });

        // Client-side name filtering
        if (filters?.name) {
          studentsList = studentsList.filter((student) =>
            student.name.toLowerCase().includes(filters.name!.toLowerCase())
          );
        }

        setStudents(studentsList);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch students"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [filters?.grade, filters?.name]);

  return { students, loading, error };
};
