"use client";

import {
  collection,
  addDoc,
  setDoc,
  doc,
  serverTimestamp,
  getDocs,
  Timestamp,
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
  createdAt: Timestamp;
}

/**
 * Add a new student to Firestore
 * Maps form fields to database fields
 */
export const addStudentToFirestore = async (
  formData: AddStudentFormData
): Promise<{ success: boolean; message: string; id?: string }> => {
  try {
    // Map form fields to Firestore fields
    // Only include fields that exist in the database schema
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
      createdAt: serverTimestamp() as Timestamp,
    };

    // Use USN as document ID if provided, otherwise auto-generate
    const studentsCollection = collection(db, "students");

    if (formData.usnNumber && formData.usnNumber.trim()) {
      // Add with custom document ID (USN)
      await setDoc(doc(db, "students", formData.usnNumber), firestoreData);
      return {
        success: true,
        message: `Student ${formData.studentName} added successfully!`,
        id: formData.usnNumber,
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
 */
export const getDashboardMetrics = async () => {
  try {
    const studentsCollection = collection(db, "students");
    const snapshot = await getDocs(studentsCollection);

    const totalStudents = snapshot.size;

    // For now, return basic metrics
    // You can expand this to include more complex calculations
    return {
      totalStudents,
      studentsEntry: Math.floor(totalStudents * 0.8), // Example: 80% entry
      studentExit: Math.floor(totalStudents * 0.6), // Example: 60% exit
      earlierPickups: Math.floor(totalStudents * 0.15), // Example: 15% early pickups
      afterSchool: Math.floor(totalStudents * 0.25), // Example: 25% after school
      onVehicle: Math.floor(totalStudents * 0.35), // Example: 35% on vehicle
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
