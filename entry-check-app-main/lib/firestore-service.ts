"use client";

import {
  collection,
  addDoc,
  setDoc,
  doc,
  serverTimestamp,
  getDoc,
  getDocs,
  deleteDoc,
  Timestamp,
  writeBatch,
  query,
  where,
  DocumentSnapshot,
} from "firebase/firestore";
import { db } from "./firebase-client";
import { dashboardStats } from "./data";

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
  fatherName: string;
  fatherMobile: string;
  motherName: string;
  motherMobile: string;
  dob: string;
  id?: string; // Add this to track the exact document ID for updates/deletes
}

// Interface for Firestore document (only fields that exist in DB)
export interface FirestoreStudent {
  name: string;
  grade: string;
  section: string;
  admissionNumber: string;
  dob: string;
  fatherName: string;
  fatherMobile: number;
  motherName: string;
  motherMobile: number;
  parentusn: string;
  gender: string;
  modeOfTransport: string;
  createdAt: Timestamp;
  usnNumber?: string; // Add this field
  usn?: string;      // Add this field for compatibility
}

/**
 * Add a new student to Firestore
 * Maps form fields to database fields
 */
export const addStudentToFirestore = async (
  formData: AddStudentFormData,
): Promise<{ success: boolean; message: string; id?: string }> => {
  try {
    const studentBase = formData.usnNumber ? formData.usnNumber.replace(/(_L01|_P01)$/, "") : "";
    const usnWithSuffix = studentBase ? `${studentBase}_L01` : "";

    // Use parentCardNumber if provided, otherwise fallback to student USN
    const parentBase = (formData.parentCardNumber || studentBase || "").replace(/(_L01|_P01)$/, "");
    const parentUSN = parentBase ? `${parentBase}_P01` : "";

    const firestoreData: FirestoreStudent = {
      name: toTitleCase(formData.studentName),
      grade: formData.grade,
      section: formData.section || "nil",
      admissionNumber: formData.admissionNumber || "N/A",
      dob: formData.dob || "N/A",
      fatherName: toTitleCase(formData.fatherName || "N/A"),
      fatherMobile: formData.fatherMobile
        ? parseInt(String(formData.fatherMobile)) || 0
        : 0,
      motherName: toTitleCase(formData.motherName || "N/A"),
      motherMobile: formData.motherMobile
        ? parseInt(String(formData.motherMobile)) || 0
        : 0,
      parentusn: parentUSN,
      gender: formData.gender || "Male",
      modeOfTransport: formData.modeOfTransport || "parent",
      createdAt: serverTimestamp() as Timestamp,
      usnNumber: usnWithSuffix,
      usn: usnWithSuffix,
    };

    const studentsCollection = collection(db, "students");

    if (usnWithSuffix) {
      await setDoc(doc(db, "students", usnWithSuffix), firestoreData);
      return {
        success: true,
        message: `Student ${formData.studentName} added successfully!`,
        id: usnWithSuffix,
      };
    } else {
      const docRef = await addDoc(studentsCollection, firestoreData);
      return {
        success: true,
        message: `Student ${formData.studentName} added successfully!`,
        id: docRef.id,
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `Error adding student: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
};

/**
 * Bulk upload students to Firestore using batch writes
 */
export interface BulkUploadStudent {
  name: string | null;
  grade: string | null;
  section: string | null;
  admissionNumber: string | null;
  usn: string | null;
  dob: string | null;
  fatherName: string | null;
  motherName: string | null;
  fatherMobile: string | null;
  motherMobile: string | null;
  modeOfTransport: string | null;
  gender: string | null;
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

    const batchSize = 500;
    const batches = [];

    for (let i = 0; i < students.length; i += batchSize) {
      const batch = writeBatch(db);
      const batchStudents = students.slice(i, i + batchSize);

      batchStudents.forEach((student) => {
        try {
          if (!student.usn) {
            errors.push(`Student "${student.name || "Unknown"}": Missing USN`);
            failedCount++;
            return;
          }

          const baseUSN = student.usn ? student.usn.replace(/(_L01|_P01)$/, "") : "";
          const usnWithSuffix = baseUSN ? `${baseUSN}_L01` : "";
          const parentUSN = baseUSN ? `${baseUSN}_P01` : "";

          const firestoreData: FirestoreStudent = {
            name: toTitleCase(student.name || "N/A"),
            grade: student.grade || "N/A",
            section: student.section || "nil",
            admissionNumber: student.admissionNumber || "N/A",
            dob: student.dob || "N/A",
            fatherName: toTitleCase(student.fatherName || "N/A"),
            fatherMobile: student.fatherMobile
              ? parseInt(String(student.fatherMobile)) || 0
              : 0,
            motherName: toTitleCase(student.motherName || "N/A"),
            motherMobile: student.motherMobile
              ? parseInt(String(student.motherMobile)) || 0
              : 0,
            parentusn: parentUSN,
            gender: student.gender || "Male",
            modeOfTransport: student.modeOfTransport || "parent",
            createdAt: serverTimestamp() as Timestamp,
            usnNumber: usnWithSuffix,
            usn: usnWithSuffix,
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

/**
 * Fetch a student by USN
 */
export const getStudentByUSN = async (
  usn: string,
): Promise<{
  success: boolean;
  data?: AddStudentFormData;
  message: string;
}> => {
  try {
    const normalizedUsn = usn.trim();
    // Strategy 1: Try with suffix (Standard)
    const usnWithSuffix = normalizedUsn.includes("_L01") ? normalizedUsn : `${normalizedUsn}_L01`;
    let docRef = doc(db, "students", usnWithSuffix);
    let docSnap = await getDoc(docRef);

    // Strategy 2: If not found, try raw USN as ID (Legacy/Other)
    if (!docSnap.exists()) {
      docRef = doc(db, "students", normalizedUsn);
      docSnap = await getDoc(docRef);
    }

    // Strategy 3: Query by usnNumber field
    if (!docSnap.exists()) {
      const q = query(
        collection(db, "students"),
        where("usnNumber", "==", normalizedUsn),
      );
      const querySnap = await getDocs(q);
      if (!querySnap.empty) {
        docSnap = querySnap.docs[0] as unknown as DocumentSnapshot;
      }
    }

    // Strategy 4: Query by usn field (Alternative field name)
    if (!docSnap.exists()) {
      const q = query(collection(db, "students"), where("usn", "==", normalizedUsn));
      const querySnap = await getDocs(q);
      if (!querySnap.empty) {
        docSnap = querySnap.docs[0] as unknown as DocumentSnapshot;
      }
    }

    if (docSnap.exists()) {
      const data = docSnap.data();
      // Determine the USN from ID or data
      const id = docSnap.id;
      const foundUsn =
        data.usnNumber || data.usn || id.replace("_L01", "").replace("_P01", "");

      const formData: AddStudentFormData = {
        studentName: data.name || "",
        admissionNumber: data.admissionNumber || "",
        grade: data.grade || "PRE-KG",
        section: data.section || "nil",
        gender: data.gender || "Male",
        usnNumber: foundUsn,
        id: id, // Store the actual ID
        modeOfTransport: data.modeOfTransport || "parent",
        parentCardNumber: data.parentusn
          ? data.parentusn.replace("_P01", "")
          : "",
        fatherName: data.fatherName === "N/A" ? "" : data.fatherName,
        fatherMobile: data.fatherMobile ? String(data.fatherMobile) : "",
        motherName: data.motherName === "N/A" ? "" : data.motherName,
        motherMobile: data.motherMobile ? String(data.motherMobile) : "",
        dob: data.dob === "N/A" ? "" : data.dob,
      };

      return {
        success: true,
        data: formData,
        message: "Student found",
      };
    } else {
      return {
        success: false,
        message: "Student not found with this USN",
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `Error fetching student: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
};

/**
 * Update an existing student in Firestore
 */
export const updateStudentInFirestore = async (
  docId: string, // Use actual document ID
  formData: AddStudentFormData,
): Promise<{ success: boolean; message: string }> => {
  try {
    const newUsn = formData.usnNumber;
    // Check if USN itself changed, we might want to rename the document ID
    // but often it's better to stick with the original ID unless USN is the ID
    const isUsnChanged = docId !== newUsn && !docId.startsWith(newUsn);

    // If docId is already a proper suffix ID, and newUsn is just the base, 
    // it's not really a "change" in current logic, just an update.
    // However, if the user explicitly changes the USN field to something else:
    const baseNewUsn = newUsn.replace(/(_L01|_P01)$/, "");
    const baseOldId = docId.replace(/(_L01|_P01)$/, "");
    const reallyChanged = baseNewUsn !== baseOldId;

    const newDocId = `${baseNewUsn}_L01`;

    // Use parentCardNumber if provided, otherwise fallback to student USN
    const parentBase = (formData.parentCardNumber || baseNewUsn || "").replace(/(_L01|_P01)$/, "");
    const parentUSN = parentBase ? `${parentBase}_P01` : "";

    const firestoreData: FirestoreStudent = {
      name: toTitleCase(formData.studentName),
      grade: formData.grade,
      section: formData.section || "nil",
      admissionNumber: formData.admissionNumber || "N/A",
      dob: formData.dob || "N/A",
      fatherName: toTitleCase(formData.fatherName || "N/A"),
      fatherMobile: formData.fatherMobile
        ? parseInt(String(formData.fatherMobile)) || 0
        : 0,
      motherName: toTitleCase(formData.motherName || "N/A"),
      motherMobile: formData.motherMobile
        ? parseInt(String(formData.motherMobile)) || 0
        : 0,
      parentusn: parentUSN,
      gender: formData.gender || "Male",
      modeOfTransport: formData.modeOfTransport || "parent",
      createdAt: serverTimestamp() as Timestamp,
      usnNumber: newDocId,
      usn: newDocId,
    };

    if (reallyChanged) {
      // Create new document with new ID
      await setDoc(doc(db, "students", newDocId), firestoreData);
      // Delete old document
      await deleteDoc(doc(db, "students", docId));

      return {
        success: true,
        message: `Student updated and USN changed to ${newUsn}!`,
      };
    } else {
      // Update existing document using its real ID
      await setDoc(doc(db, "students", docId), firestoreData, {
        merge: true,
      });

      return {
        success: true,
        message: `Student ${formData.studentName} updated successfully!`,
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `Error updating student: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
};

/**
 * Delete a student from Firestore
 */
export const deleteStudentFromFirestore = async (
  docId: string,
): Promise<{ success: boolean; message: string }> => {
  try {
    // Directly delete using the known document ID
    await deleteDoc(doc(db, "students", docId));

    return {
      success: true,
      message: `Student deleted successfully!`,
    };
  } catch (error) {
    return {
      success: false,
      message: `Error deleting student: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
};

/**
 * Fetch dashboard metrics from Firestore
 * Entry/Exit counts reset daily at midnight
 * @param targetDate - Optional date to fetch metrics for (defaults to today)
 */
export const getDashboardMetrics = async (targetDate?: Date) => {
  try {
    const studentsSnap = await getDocs(collection(db, "students"));
    const totalStudents = studentsSnap.size;

    let studentsEntry = 0;
    let studentExit = 0;

    // Fetch attendance logs
    const attendanceSnap = await getDocs(collection(db, "attendance_logs"));

    if (attendanceSnap.empty) {
      return {
        totalStudents,
        studentsEntry: 0,
        studentExit: 0,
        earlierPickups: 0,
        afterSchool: 0,
        onVehicle: 0,
        activeToday: 0,
        avgAttendance: 0,
        newStudents: 0,
      };
    }

    // Use provided date or default to today
    const queryDate = targetDate || new Date();
    const startOfDay = new Date(queryDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(queryDate);
    endOfDay.setHours(23, 59, 59, 999);

    attendanceSnap.forEach((docSnap) => {
      const data = docSnap.data();

      // Get timestamp
      let docDate = null;
      if (data.timestamp && typeof data.timestamp.toDate === "function") {
        try {
          docDate = data.timestamp.toDate();
        } catch (e) {
          // ignore
        }
      }

      // Check if from selected date
      if (!docDate || docDate < startOfDay || docDate > endOfDay) {
        return;
      }

      // Count by type
      const type = data.type;

      if (type === "ENTRY") {
        studentsEntry++;
      } else if (type === "EXIT") {
        studentExit++;
      }
    });

    return {
      totalStudents,
      studentsEntry,
      studentExit,
      earlierPickups: 0,
      afterSchool: 0,
      onVehicle: 0,
      activeToday: 0,
      avgAttendance: 0,
      newStudents: 0,
    };
  } catch (error) {
    return {
      totalStudents: 0,
      studentsEntry: 0,
      studentExit: 0,
      earlierPickups: 0,
      afterSchool: 0,
      onVehicle: 0,
      activeToday: 0,
      avgAttendance: 0,
      newStudents: 0,
    };
  }
};

/**
 * Fetch grade-wise attendance for a specific date
 * Returns total strength and present count for each grade
 * @param targetDate - Optional date to fetch attendance for (defaults to today)
 */
export const getGradeWiseAttendance = async (targetDate?: Date) => {
  try {
    // Get all students grouped by grade
    const studentsSnap = await getDocs(collection(db, "students"));
    const gradeMap: Record<
      string,
      { strength: number; presentUSNs: Set<string> }
    > = {};

    // Count total students per grade
    studentsSnap.forEach((docSnap) => {
      const data = docSnap.data();
      const grade = data.grade || "Unknown";

      if (!gradeMap[grade]) {
        gradeMap[grade] = { strength: 0, presentUSNs: new Set() };
      }
      gradeMap[grade].strength += 1;
    });

    // Use provided date or default to today
    const queryDate = targetDate || new Date();
    const startOfDay = new Date(queryDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(queryDate);
    endOfDay.setHours(23, 59, 59, 999);

    const attendanceSnap = await getDocs(collection(db, "attendance_logs"));

    // Track students who have entered on selected date (and haven't exited after their last entry)
    const studentStatus: Record<
      string,
      { lastAction: string; timestamp: Date }
    > = {};

    attendanceSnap.forEach((docSnap) => {
      const data = docSnap.data();

      // Get timestamp
      let docDate = null;
      if (data.timestamp && typeof data.timestamp.toDate === "function") {
        docDate = data.timestamp.toDate();
      }

      // Only process logs from selected date
      if (!docDate || docDate < startOfDay || docDate > endOfDay) {
        return;
      }

      const usn = data.usn;
      const type = data.type;

      if (!usn || !type) return;

      // Update student status with latest action
      if (!studentStatus[usn] || docDate > studentStatus[usn].timestamp) {
        studentStatus[usn] = { lastAction: type, timestamp: docDate };
      }
    });

    // Count present students (those whose last action was ENTRY)
    Object.entries(studentStatus).forEach(([usn, status]) => {
      if (status.lastAction === "ENTRY") {
        // Find this student's grade
        const studentDoc = studentsSnap.docs.find((doc) => doc.id === usn);
        if (studentDoc) {
          const grade = studentDoc.data().grade || "Unknown";
          if (gradeMap[grade]) {
            gradeMap[grade].presentUSNs.add(usn);
          }
        }
      }
    });

    // Convert to array format
    const gradeAttendance = Object.entries(gradeMap).map(([grade, data]) => ({
      grade,
      strength: data.strength,
      present: data.presentUSNs.size,
    }));

    // Sort by grade
    const gradeOrder = [
      "PRE-KG",
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
    ];
    gradeAttendance.sort((a, b) => {
      const indexA = gradeOrder.indexOf(a.grade);
      const indexB = gradeOrder.indexOf(b.grade);
      if (indexA === -1 && indexB === -1) return a.grade.localeCompare(b.grade);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });

    return gradeAttendance;
  } catch (error) {
    return [];
  }
};

/**
 * Helper to convert strings to Title Case (Camel Case style for names)
 * Example: "JOHN DOE" -> "John Doe", "jane doe" -> "Jane Doe"
 */
export function toTitleCase(str: string | null | undefined): string {
  if (!str || typeof str !== "string") return "N/A";
  
  return str
    .toLowerCase()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
