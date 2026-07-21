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
import { normalizeGrade } from "./file-parser";

// Interface for form data
export interface AddStudentFormData {
  studentName: string;
  grade: string;
  usnNumber: string;
  id?: string;
  segment?: string;
}

// Interface for Firestore document
export interface FirestoreStudent {
  name: string;
  grade: string;
  segment: string;
  createdAt: Timestamp;
  usnNumber?: string;
  usn?: string;
}

/**
 * Automatically determine the segment based on the grade
 */
export const calculateSegment = (grade: string): string => {
  const g = grade.toUpperCase();
  if (["PREKG", "LKG", "UKG"].includes(g)) return "EYP";
  if (["G1", "G2", "G3", "G4", "G5"].includes(g)) return "PYP";
  if (["G6", "G7", "G8"].includes(g)) return "CIE LS";
  if (["G9", "G10"].includes(g)) return "CIE US";
  if (["G11", "G12"].includes(g)) return "CIE SS";
  return "Unknown";
};

/**
 * Add a new student to Firestore
 */
export const addStudentToFirestore = async (
  formData: AddStudentFormData,
): Promise<{ success: boolean; message: string; id?: string }> => {
  try {
    const studentBase = formData.usnNumber ? formData.usnNumber.replace(/(_L01|_P01)$/, "") : "";
    const usnWithSuffix = studentBase ? `${studentBase}_L01` : "";
    const normalizedGrade = normalizeGrade(formData.grade) || formData.grade;

    const firestoreData: FirestoreStudent = {
      name: toTitleCase(formData.studentName),
      grade: normalizedGrade,
      segment: calculateSegment(normalizedGrade),
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

export interface BulkUploadStudent {
  name: string | null;
  grade: string | null;
  usn: string | null;
  segment: string | null;
}

export const bulkUploadStudents = async (
  students: BulkUploadStudent[],
  preventDuplicates = true,
  cachedStudents?: Array<{ usn: string; usnNumber: string; id: string }>,
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

    const seenLocalUSNs = new Set<string>();
    const fileUniqueStudents = students.filter((s) => {
      if (!s.usn) return true;
      const baseUSN = s.usn.trim().replace(/(_L01|_P01)$/, "");
      const usnWithSuffix = baseUSN ? `${baseUSN}_L01` : "";
      if (seenLocalUSNs.has(usnWithSuffix)) {
        errors.push(`Student "${s.name || "Unknown"}": Duplicate USN in file (${s.usn}), skipping.`);
        failedCount++;
        return false;
      }
      seenLocalUSNs.add(usnWithSuffix);
      return true;
    });

    const existingUSNs = preventDuplicates
      ? await checkExistingStudents(fileUniqueStudents.map((s) => s.usn).filter(Boolean) as string[], cachedStudents)
      : new Set<string>();

    const studentsToUpload = fileUniqueStudents.filter((s) => {
      if (!s.usn) return true;
      const baseUSN = s.usn.trim().replace(/(_L01|_P01)$/, "");
      const usnWithSuffix = baseUSN ? `${baseUSN}_L01` : "";
      if (existingUSNs.has(usnWithSuffix)) {
        errors.push(`Student "${s.name || "Unknown"}": Already exists in database (${usnWithSuffix}), skipping.`);
        failedCount++;
        return false;
      }
      return true;
    });

    if (studentsToUpload.length === 0) {
      return {
        success: true,
        message: `No new students to upload. All students already exist or are duplicates.`,
        uploaded: 0,
        failed: failedCount,
        errors,
      };
    }

    const batchSize = 500;
    const batches = [];

    for (let i = 0; i < studentsToUpload.length; i += batchSize) {
      const batch = writeBatch(db);
      const batchStudents = studentsToUpload.slice(i, i + batchSize);

      batchStudents.forEach((student) => {
        try {
          if (!student.usn) {
            errors.push(`Student "${student.name || "Unknown"}": Missing USN`);
            failedCount++;
            return;
          }

          const baseUSN = student.usn ? student.usn.replace(/(_L01|_P01)$/, "") : "";
          const usnWithSuffix = baseUSN ? `${baseUSN}_L01` : "";
          const normalizedGrade = normalizeGrade(student.grade) || student.grade || "N/A";
          
          const firestoreData: FirestoreStudent = {
            name: toTitleCase(student.name || "N/A"),
            grade: normalizedGrade,
            segment: student.segment && student.segment.length > 0 ? student.segment : calculateSegment(normalizedGrade),
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
        : `Uploaded ${uploadedCount} student(s), ${failedCount} skipped/failed`;

    return {
      success: uploadedCount > 0,
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

export const checkExistingStudents = async (
  usns: string[],
  cachedStudents?: Array<{ usn: string; usnNumber: string; id: string }>,
): Promise<Set<string>> => {
  const existingUSNs = new Set<string>();
  if (!usns || usns.length === 0) return existingUSNs;

  try {
    const normalizedUSNs = usns.map((usn) => {
      if (!usn) return "";
      const baseUSN = usn.trim().replace(/(_L01|_P01)$/, "");
      return baseUSN ? `${baseUSN}_L01` : "";
    }).filter(Boolean);

    // Bonus fix: Check cached students first to reduce Firestore queries
    let usnToQuery = normalizedUSNs;
    if (cachedStudents) {
      const cachedUSNSet = new Set(
        cachedStudents.flatMap((s) => [s.usnNumber, s.usn, s.id].filter(Boolean))
      );
      usnToQuery = [];
      normalizedUSNs.forEach((usn) => {
        if (cachedUSNSet.has(usn)) {
          existingUSNs.add(usn);
        } else {
          usnToQuery.push(usn);
        }
      });
    }

    if (usnToQuery.length === 0) return existingUSNs;

    const chunkSize = 30;
    const promises = [];

    for (let i = 0; i < usnToQuery.length; i += chunkSize) {
      const chunk = usnToQuery.slice(i, i + chunkSize);
      const q = query(
        collection(db, "students"),
        where("usnNumber", "in", chunk),
      );
      promises.push(getDocs(q));
    }

    const snapshots = await Promise.all(promises);
    snapshots.forEach((snap) => {
      snap.forEach((doc) => {
        const data = doc.data();
        if (data.usnNumber) {
          existingUSNs.add(data.usnNumber);
        }
        existingUSNs.add(doc.id);
      });
    });
  } catch (error) {
    console.error("Error checking existing students:", error);
  }

  return existingUSNs;
};

export const getStudentByUSN = async (
  usn: string,
  cachedStudents?: Array<{ id: string; usn: string; usnNumber: string; name: string; grade: string }>,
): Promise<{
  success: boolean;
  data?: AddStudentFormData;
  message: string;
}> => {
  try {
    const normalizedUsn = usn.trim();
    const usnWithSuffix = normalizedUsn.includes("_L01") ? normalizedUsn : `${normalizedUsn}_L01`;

    // Fix 3: Check cached students first to avoid Firestore reads
    if (cachedStudents) {
      const cached = cachedStudents.find(
        (s) =>
          s.usnNumber === usnWithSuffix ||
          s.usnNumber === normalizedUsn ||
          s.usn === usnWithSuffix ||
          s.usn === normalizedUsn ||
          s.id === usnWithSuffix ||
          s.id === normalizedUsn ||
          s.name.toLowerCase() === normalizedUsn.toLowerCase()
      );

      if (cached) {
        const normalizedGrade = normalizeGrade(cached.grade) || cached.grade || "PREKG";
        const foundUsn = cached.usnNumber || cached.usn || cached.id.replace("_L01", "").replace("_P01", "");
        return {
          success: true,
          data: {
            studentName: cached.name || "",
            grade: normalizedGrade,
            segment: calculateSegment(normalizedGrade),
            usnNumber: foundUsn,
            id: cached.id,
          },
          message: "Student found (from cache)",
        };
      }
    }

    // Firestore fallback — only runs on cache miss
    let docRef = doc(db, "students", usnWithSuffix);
    let docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      docRef = doc(db, "students", normalizedUsn);
      docSnap = await getDoc(docRef);
    }

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

    if (!docSnap.exists()) {
      const q = query(collection(db, "students"), where("usn", "==", normalizedUsn));
      const querySnap = await getDocs(q);
      if (!querySnap.empty) {
        docSnap = querySnap.docs[0] as unknown as DocumentSnapshot;
      }
    }

    if (!docSnap.exists()) {
      const titleCaseName = toTitleCase(normalizedUsn);
      const q = query(collection(db, "students"), where("name", "==", titleCaseName));
      const querySnap = await getDocs(q);
      if (!querySnap.empty) {
        docSnap = querySnap.docs[0] as unknown as DocumentSnapshot;
      }
    }

    if (docSnap.exists()) {
      const data = docSnap.data();
      const id = docSnap.id;
      const foundUsn = data.usnNumber || data.usn || id.replace("_L01", "").replace("_P01", "");
      const normalizedGrade = normalizeGrade(data.grade) || data.grade || "PREKG";

      const formData: AddStudentFormData = {
        studentName: data.name || "",
        grade: normalizedGrade,
        segment: data.segment || calculateSegment(normalizedGrade),
        usnNumber: foundUsn,
        id: id,
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

export const updateStudentInFirestore = async (
  docId: string,
  formData: AddStudentFormData,
): Promise<{ success: boolean; message: string }> => {
  try {
    const newUsn = formData.usnNumber;
    const baseNewUsn = newUsn.replace(/(_L01|_P01)$/, "");
    const baseOldId = docId.replace(/(_L01|_P01)$/, "");
    const reallyChanged = baseNewUsn !== baseOldId;

    const newDocId = `${baseNewUsn}_L01`;
    const normalizedGrade = normalizeGrade(formData.grade) || formData.grade;

    const firestoreData: FirestoreStudent = {
      name: toTitleCase(formData.studentName),
      grade: normalizedGrade,
      segment: calculateSegment(normalizedGrade),
      createdAt: serverTimestamp() as Timestamp,
      usnNumber: newDocId,
      usn: newDocId,
    };

    if (reallyChanged) {
      await setDoc(doc(db, "students", newDocId), firestoreData);
      await deleteDoc(doc(db, "students", docId));

      return {
        success: true,
        message: `Student updated and USN changed to ${newUsn}!`,
      };
    } else {
      await setDoc(doc(db, "students", docId), firestoreData, { merge: true });
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

export const deleteStudentFromFirestore = async (
  docId: string,
): Promise<{ success: boolean; message: string }> => {
  try {
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

export function toTitleCase(str: string | null | undefined): string {
  if (!str || typeof str !== "string") return "N/A";
  
  return str
    .toLowerCase()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
