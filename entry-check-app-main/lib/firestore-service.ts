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
  fatherName: string;
  fatherMobile: string;
  motherName: string;
  motherMobile: string;
  dob: string;
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
}

/**
 * Add a new student to Firestore
 * Maps form fields to database fields
 */
export const addStudentToFirestore = async (
  formData: AddStudentFormData,
): Promise<{ success: boolean; message: string; id?: string }> => {
  try {
    const studentBase = formData.usnNumber;
    const usnWithSuffix = studentBase ? `${studentBase}_L01` : "";

    // Use parentCardNumber if provided, otherwise fallback to student USN
    const parentBase = formData.parentCardNumber || studentBase;
    const parentUSN = parentBase ? `${parentBase}_P01` : "";

    const firestoreData: FirestoreStudent = {
      name: formData.studentName,
      grade: formData.grade,
      section: formData.section || "nil",
      admissionNumber: formData.admissionNumber || "N/A",
      dob: formData.dob || "N/A",
      fatherName: formData.fatherName || "N/A",
      fatherMobile: formData.fatherMobile
        ? parseInt(String(formData.fatherMobile))
        : 0,
      motherName: formData.motherName || "N/A",
      motherMobile: formData.motherMobile
        ? parseInt(String(formData.motherMobile))
        : 0,
      parentusn: parentUSN,
      gender: formData.gender || "Male",
      modeOfTransport: formData.modeOfTransport || "parent",
      createdAt: serverTimestamp() as Timestamp,
    };

    const studentsCollection = collection(db, "students");

    if (formData.usnNumber && formData.usnNumber.trim()) {
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
    console.error("Error adding student:", error);
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

          const usnWithSuffix = `${student.usn}_L01`;
          const parentUSN = `${student.usn}_P01`;

          const firestoreData: FirestoreStudent = {
            name: student.name || "N/A",
            grade: student.grade || "N/A",
            section: student.section || "nil",
            admissionNumber: student.admissionNumber || "N/A",
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
            gender: student.gender || "Male",
            modeOfTransport: student.modeOfTransport || "parent",
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
): Promise<{ success: boolean; data?: AddStudentFormData; message: string }> => {
  try {
    const usnWithSuffix = usn.includes("_L01") ? usn : `${usn}_L01`;
    const docRef = doc(db, "students", usnWithSuffix);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const formData: AddStudentFormData = {
        studentName: data.name || "",
        admissionNumber: data.admissionNumber || "",
        grade: data.grade || "PRE-KG",
        section: data.section || "nil",
        gender: data.gender || "Male",
        usnNumber: usn.replace("_L01", ""),
        modeOfTransport: data.modeOfTransport || "parent",
        parentCardNumber: data.parentusn ? data.parentusn.replace("_P01", "") : "",
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
    console.error("Error fetching student:", error);
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
  originalUsn: string,
  formData: AddStudentFormData,
): Promise<{ success: boolean; message: string }> => {
  try {
    const newUsn = formData.usnNumber;
    const isUsnChanged = originalUsn !== newUsn;

    const oldDocId = originalUsn.includes("_L01") ? originalUsn : `${originalUsn}_L01`;
    const newDocId = newUsn.includes("_L01") ? newUsn : `${newUsn}_L01`;

    // Use parentCardNumber if provided, otherwise fallback to student USN
    const parentBase = formData.parentCardNumber || newUsn;
    const parentUSN = parentBase ? (parentBase.includes("_P01") ? parentBase : `${parentBase}_P01`) : "";

    const firestoreData: FirestoreStudent = {
      name: formData.studentName,
      grade: formData.grade,
      section: formData.section || "nil",
      admissionNumber: formData.admissionNumber || "N/A",
      dob: formData.dob || "N/A",
      fatherName: formData.fatherName || "N/A",
      fatherMobile: formData.fatherMobile
        ? parseInt(String(formData.fatherMobile))
        : 0,
      motherName: formData.motherName || "N/A",
      motherMobile: formData.motherMobile
        ? parseInt(String(formData.motherMobile))
        : 0,
      parentusn: parentUSN,
      gender: formData.gender || "Male",
      modeOfTransport: formData.modeOfTransport || "parent",
      createdAt: serverTimestamp() as Timestamp,
    };

    if (isUsnChanged) {
      // Create new document
      await setDoc(doc(db, "students", newDocId), firestoreData);
      // Delete old document
      await deleteDoc(doc(db, "students", oldDocId));

      return {
        success: true,
        message: `Student USN changed from ${originalUsn} to ${newUsn} and data updated!`,
      };
    } else {
      // Update existing document
      await setDoc(doc(db, "students", oldDocId), firestoreData, {
        merge: true,
      });

      return {
        success: true,
        message: `Student ${formData.studentName} updated successfully!`,
      };
    }
  } catch (error) {
    console.error("Error updating student:", error);
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
  usn: string,
): Promise<{ success: boolean; message: string }> => {
  try {
    const usnWithSuffix = usn.includes("_L01") ? usn : `${usn}_L01`;
    await deleteDoc(doc(db, "students", usnWithSuffix));

    return {
      success: true,
      message: `Student with USN ${usn} deleted successfully!`,
    };
  } catch (error) {
    console.error("Error deleting student:", error);
    return {
      success: false,
      message: `Error deleting student: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
};

/**
 * Fetch dashboard metrics from Firestore
 */
export const getDashboardMetrics = async () => {
  try {
    const studentsSnap = await getDocs(collection(db, "students"));
    const totalStudents = studentsSnap.size;

    // You can add more complex logic here if needed (e.g., filtering by attendance)
    // For now, returning total students and some placeholder numbers
    return {
      totalStudents,
      activeToday: 0, // Placeholder
      avgAttendance: 0, // Placeholder
      newStudents: 0, // Placeholder
    };
  } catch (error) {
    console.error("Error fetching dashboard metrics:", error);
    return {
      totalStudents: 0,
      activeToday: 0,
      avgAttendance: 0,
      newStudents: 0,
    };
  }
};

