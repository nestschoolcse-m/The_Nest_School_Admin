"use client";

import {
  collection,
  addDoc,
  setDoc,
  doc,
  serverTimestamp,
  getDocs,
  Timestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase-client";

// Interface for form data (includes fields not in database)
export interface AddStudentFormData {
  studentName: string;
  admissionNumber: string;
  grade: string;
  section: string;
  gender: string;
  usnNumber: string;
  modeOfTransport: string;
  parentCardNumber: string;
  fatherName?: string;
  fatherMobile?: string;
  motherName?: string;
  motherMobile?: string;
  dob?: string;
}

// Interface for Firestore document (only fields that exist in DB)
export interface FirestoreStudent {
  name: string;
  grade: string;
  dob: string;
  fatherName: string;
  fatherMobile: number;
  motherName: string;
  motherMobile: number;
  parentusn: string;
  createdAt: Timestamp;
}

/**
 * Add a new student to Firestore
 * Maps form fields to database fields
 */
export const addStudentToFirestore = async (
  formData: AddStudentFormData,
): Promise<{ success: boolean; message: string; id?: string }> => {
  try {
    // Map form fields to Firestore fields
    // Only include fields that exist in the database schema
    const usnWithSuffix = formData.usnNumber ? `${formData.usnNumber}_L01` : "";
    const parentUSN = formData.usnNumber ? `${formData.usnNumber}_P01` : "";

    const firestoreData: FirestoreStudent = {
      name: formData.studentName,
      grade: formData.grade,
      dob: formData.dob || "N/A", // Use provided dob or default
      fatherName: formData.fatherName || "N/A",
      fatherMobile: formData.fatherMobile
        ? parseInt(String(formData.fatherMobile))
        : 0,
      motherName: formData.motherName || "N/A",
      motherMobile: formData.motherMobile
        ? parseInt(String(formData.motherMobile))
        : 0,
      parentusn: parentUSN,
      createdAt: serverTimestamp() as Timestamp,
    };

    // Use USN as document ID if provided, otherwise auto-generate
    const studentsCollection = collection(db, "students");

    if (formData.usnNumber && formData.usnNumber.trim()) {
      // Add with custom document ID (USN) with _L01 suffix
      await setDoc(doc(db, "students", usnWithSuffix), firestoreData);
      return {
        success: true,
        message: `Student ${formData.studentName} added successfully!`,
        id: usnWithSuffix,
      };
    } else {
      // Auto-generate document ID
      const docRef = await addDoc(studentsCollection, firestoreData);
      return {
        success: true,
        message: `Student ${formData.studentName} added successfully!`,
        id: docRef.id,
      };
    }
  } catch (error) {
    console.error("Error adding student:", error);
    return {
      success: false,
      message: `Error adding student: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
};

/**
 * Fetch dashboard metrics from Firestore
 * Gets today's attendance logs from attendance_logs collection
 */
export const getDashboardMetrics = async () => {
  try {
    const studentsCollection = collection(db, "students");
    const studentsSnapshot = await getDocs(studentsCollection);
    const totalStudents = studentsSnapshot.size;

    // Fetch attendance logs from the attendance_logs collection
    const attendanceLogsCollection = collection(db, "attendance_logs");
    const logsSnapshot = await getDocs(attendanceLogsCollection);

    // Get today's date at start of day (00:00:00)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayStart = today.getTime();
    const todayEnd = todayStart + 24 * 60 * 60 * 1000; // End of day

    // Track unique students with entry and exit today
    const studentsWithEntry = new Set<string>();
    const studentsWithExit = new Set<string>();

    logsSnapshot.forEach((doc) => {
      const data = doc.data();
      const timestamp = data.timestamp;

      let logTime = 0;

      // Handle different timestamp formats
      if (typeof timestamp === "string") {
        logTime = new Date(timestamp).getTime();
      } else if (timestamp instanceof Timestamp) {
        logTime = timestamp.toMillis();
      } else if (typeof timestamp === "number") {
        logTime = timestamp;
      }

      // Check if log is from today
      if (logTime >= todayStart && logTime < todayEnd) {
        const usn = data.usn;
        const type = data.type?.toUpperCase();

        if (usn) {
          if (type === "ENTRY") {
            studentsWithEntry.add(usn);
          } else if (type === "EXIT") {
            studentsWithExit.add(usn);
          }
        }
      }
    });

    const studentsEntry = studentsWithEntry.size;
    const studentExit = studentsWithExit.size;

    return {
      totalStudents,
      studentsEntry,
      studentExit,
      earlierPickups: Math.floor(totalStudents * 0.15), // Placeholder for now
      afterSchool: Math.floor(totalStudents * 0.25), // Placeholder for now
      onVehicle: Math.floor(totalStudents * 0.35), // Placeholder for now
    };
  } catch (error) {
    console.error("Error fetching dashboard metrics:", error);
    return {
      totalStudents: 0,
      studentsEntry: 0,
      studentExit: 0,
      earlierPickups: 0,
      afterSchool: 0,
      onVehicle: 0,
    };
  }
};

/**
 * Fetch students by grade for grade attendance chart
 */
export const getStudentsByGradeForChart = async () => {
  try {
    const studentsCollection = collection(db, "students");
    const snapshot = await getDocs(studentsCollection);

    const gradeMap: { [key: string]: number } = {};

    snapshot.forEach((doc) => {
      const data = doc.data();
      const grade = data.grade || "Unknown";
      gradeMap[grade] = (gradeMap[grade] || 0) + 1;
    });

    return gradeMap;
  } catch (error) {
    console.error("Error fetching grade data:", error);
    return {};
  }
};

/**
 * Bulk upload students to Firestore using batch writes
 */
export interface BulkUploadStudent {
  name: string | null;
  grade: string | null;
  usn: string | null;
  dob: string | null;
  fatherName: string | null;
  motherName: string | null;
  fatherMobile: string | null;
  motherMobile: string | null;
}

export const bulkUploadStudents = async (
  students: BulkUploadStudent[],
): Promise<{
  success: boolean;
  message: string;
  uploaded: number;
  failed: number;
  errors: string[];
}> => {
  const errors: string[] = [];
  let uploadedCount = 0;
  let failedCount = 0;

  try {
    if (!students || students.length === 0) {
      return {
        success: false,
        message: "No students to upload",
        uploaded: 0,
        failed: 0,
        errors: ["No valid student records found in the file"],
      };
    }

    // Firebase has a limit of 500 operations per batch
    const batchSize = 500;
    const batches = [];

    for (let i = 0; i < students.length; i += batchSize) {
      const batch = writeBatch(db);
      const batchStudents = students.slice(i, i + batchSize);

      batchStudents.forEach((student) => {
        try {
          // Validate required fields
          if (!student.usn) {
            errors.push(`Student "${student.name || "Unknown"}": Missing USN`);
            failedCount++;
            return;
          }

          // Create Firestore document
          // Add _L01 suffix to USN and create _P01 parent USN
          const usnWithSuffix = `${student.usn}_L01`;
          const parentUSN = `${student.usn}_P01`;

          const firestoreData: FirestoreStudent = {
            name: student.name || "N/A",
            grade: student.grade || "N/A",
            dob: student.dob || "N/A",
            fatherName: student.fatherName || "N/A",
            fatherMobile: student.fatherMobile
              ? parseInt(String(student.fatherMobile))
              : 0,
            motherName: student.motherName || "N/A",
            motherMobile: student.motherMobile
              ? parseInt(String(student.motherMobile))
              : 0,
            parentusn: parentUSN,
            createdAt: serverTimestamp() as Timestamp,
          };

          const docRef = doc(db, "students", usnWithSuffix);
          batch.set(docRef, firestoreData, { merge: true });
          uploadedCount++;
        } catch (error) {
          errors.push(
            `Student "${student.name || "Unknown"}": ${error instanceof Error ? error.message : "Unknown error"}`,
          );
          failedCount++;
        }
      });

      batches.push(batch.commit());
    }

    // Execute all batches
    await Promise.all(batches);

    const message =
      failedCount === 0
        ? `Successfully uploaded ${uploadedCount} student(s)`
        : `Uploaded ${uploadedCount} student(s), ${failedCount} failed`;

    return {
      success: failedCount === 0,
      message,
      uploaded: uploadedCount,
      failed: failedCount,
      errors,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      message: `Bulk upload failed: ${errorMessage}`,
      uploaded: uploadedCount,
      failed: failedCount,
      errors: [...errors, errorMessage],
    };
  }
};
