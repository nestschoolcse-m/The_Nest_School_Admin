"use client";

import type React from "react";

import { useState } from "react";
import { UserPlus, RefreshCw, Trash2, User, Upload, X, Check, AlertTriangle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { grades, sections, genders, transportModes } from "@/lib/data";
import {
  addStudentToFirestore,
  bulkUploadStudents,
  getStudentByUSN,
  updateStudentInFirestore,
  deleteStudentFromFirestore,
  checkExistingStudents,
  bulkDeleteStudents,
} from "@/lib/firestore-service";
import { parseCSV, parseXLSX, normalizeGrade } from "@/lib/file-parser";
import { toast } from "sonner";

type FormMode = "add" | "modify" | "delete" | "bulk";

export function AddStudentForm() {
  const [mode, setMode] = useState<FormMode>("add");
  const [loading, setLoading] = useState(false);
  const [searchUsn, setSearchUsn] = useState("");
  const [originalUsn, setOriginalUsn] = useState("");
  const [formData, setFormData] = useState({
    studentName: "",
    admissionNumber: "",
    grade: "PREKG",
    section: "A",
    gender: "Male",
    usnNumber: "",
    modeOfTransport: "parent",
    parentCardNumber: "",
    fatherName: "",
    fatherMobile: "",
    motherName: "",
    motherMobile: "",
    dob: "",
    id: "", // Added to track Firestore ID
  });

  // Bulk upload states
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<string>("all");
  const [availableGrades, setAvailableGrades] = useState<string[]>([]);
  const [parsedData, setParsedData] = useState<any>(null);
  const [uploadStatus, setUploadStatus] = useState<{
    total: number;
    uploaded: number;
    failed: number;
    errors: string[];
  } | null>(null);

  // Selection and filter states for bulk upload
  const [selectedUsns, setSelectedUsns] = useState<Set<string>>(new Set());
  const [existingDatabaseUsns, setExistingDatabaseUsns] = useState<Set<string>>(new Set());
  const [filterSection, setFilterSection] = useState<string>("all");

  // Bulk delete states
  const [deleteSubMode, setDeleteSubMode] = useState<"single" | "bulk">("single");
  const [deleteFile, setDeleteFile] = useState<File | null>(null);
  const [parsedDeleteData, setParsedDeleteData] = useState<any>(null);
  const [selectedDeleteUsns, setSelectedDeleteUsns] = useState<Set<string>>(new Set());

  const resetBulkDelete = () => {
    setDeleteFile(null);
    setParsedDeleteData(null);
    setSelectedDeleteUsns(new Set());
  };

  const handleDeleteFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      resetBulkDelete();

      let parsed;
      if (file.name.endsWith(".csv")) {
        parsed = await parseCSV(file);
      } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
        parsed = await parseXLSX(file);
      } else {
        toast.error("Please upload a CSV or XLSX file");
        setLoading(false);
        return;
      }

      if (!parsed.deleteStudents || parsed.deleteStudents.length === 0) {
        toast.error("The uploaded file does not contain a sheet named 'Transfer Certificate 2025-26' or no valid student records were found.");
        setLoading(false);
        return;
      }

      setDeleteFile(file);
      setParsedDeleteData(parsed);
      
      // Auto-select all parsed delete students by default
      const initialSelected = new Set<string>();
      parsed.deleteStudents.forEach((s) => {
        if (s.usn) {
          initialSelected.add(s.usn);
        }
      });
      setSelectedDeleteUsns(initialSelected);

      const totalStudents = parsed.deleteStudents.length;
      toast.success(`File parsed successfully! Found ${totalStudents} student(s) to delete.`);
    } catch (error) {
      toast.error(`Error parsing file: ${error instanceof Error ? error.message : "Unknown error"}`);
      resetBulkDelete();
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!parsedDeleteData || !parsedDeleteData.deleteStudents) {
      toast.error("Please select and parse a file first");
      return;
    }

    const studentsToDelete = parsedDeleteData.deleteStudents.filter((s: any) => s.usn && selectedDeleteUsns.has(s.usn));
    if (studentsToDelete.length === 0) {
      toast.error("Please select at least one student to delete");
      return;
    }

    if (
      !confirm(
        `Are you absolutely sure you want to delete ${studentsToDelete.length} selected student(s) from the database? This action is permanent and cannot be undone.`
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      const usnsToDelete = studentsToDelete.map((s: any) => s.usn);
      const result = await bulkDeleteStudents(usnsToDelete);

      if (result.success) {
        toast.success(result.message);
        resetBulkDelete();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error(`Error during bulk delete: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "add") {
        const result = await addStudentToFirestore(formData);

        if (result.success) {
          toast.success(result.message);
          // Reset form
          setFormData({
            studentName: "",
            admissionNumber: "",
            grade: "PREKG",
            section: "A",
            gender: "Male",
            usnNumber: "",
            modeOfTransport: "parent",
            parentCardNumber: "",
            fatherName: "",
            fatherMobile: "",
            motherName: "",
            motherMobile: "",
            dob: "",
            id: "",
          });
        } else {
          toast.error(result.message);
        }
      } else if (mode === "modify") {
        if (!formData.id) {
          toast.error("Please fetch a student first");
          setLoading(false);
          return;
        }
        const result = await updateStudentInFirestore(formData.id, formData);
        if (result.success) {
          toast.success(result.message);
          // Don't reset form in modify mode so user can see their changes
        } else {
          toast.error(result.message);
        }
      } else if (mode === "delete") {
        if (!formData.id) {
          toast.error("Please fetch a student first");
          setLoading(false);
          return;
        }
        const result = await deleteStudentFromFirestore(formData.id);
        if (result.success) {
          toast.success(result.message);
          setFormData({
            studentName: "",
            admissionNumber: "",
            grade: "PREKG",
            section: "A",
            gender: "Male",
            usnNumber: "",
            modeOfTransport: "parent",
            parentCardNumber: "",
            fatherName: "",
            fatherMobile: "",
            motherName: "",
            motherMobile: "",
            dob: "",
            id: "",
          });
          setSearchUsn("");
        } else {
          toast.error(result.message);
        }
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      setLoading(true);
      setUploadStatus(null);
      setParsedData(null);
      setSelectedUsns(new Set());
      setExistingDatabaseUsns(new Set());
      setFilterSection("all");

      // Parse file based on type
      let parsed;
      if (file.name.endsWith(".csv")) {
        parsed = await parseCSV(file);
      } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
        parsed = await parseXLSX(file);
      } else {
        toast.error("Please upload a CSV or XLSX file");
        setBulkFile(null);
        setLoading(false);
        return;
      }

      // Deduplicate students within the parsed file itself (first occurrence wins)
      const seenLocal = new Set<string>();
      const cleanStudentsMap: { [grade: string]: any[] } = {};
      Object.entries(parsed.students).forEach(([grade, list]: [string, any]) => {
        cleanStudentsMap[grade] = list.filter((s: any) => {
          if (!s.usn) return true; // Let missing USN validation flag it
          const baseUSN = s.usn.trim().replace(/(_L01|_P01)$/, "");
          const usnWithSuffix = baseUSN ? `${baseUSN}_L01` : "";
          if (seenLocal.has(usnWithSuffix)) return false;
          seenLocal.add(usnWithSuffix);
          return true;
        });
      });
      parsed.students = cleanStudentsMap;

      setBulkFile(file);
      setParsedData(parsed);
      setAvailableGrades(parsed.grades);
      setSelectedGrade("all");

      const allStudentsList = Object.values(parsed.students).flat() as any[];
      const allUsns = allStudentsList.map((s) => s.usn).filter(Boolean) as string[];

      // Query Firestore for existing students
      const existingInDb = await checkExistingStudents(allUsns);
      setExistingDatabaseUsns(existingInDb);

      // Auto-select all new students by default (exclude existing in db)
      const initialSelected = new Set<string>();
      allStudentsList.forEach((s) => {
        if (s.usn) {
          const baseUSN = s.usn.trim().replace(/(_L01|_P01)$/, "");
          const usnWithSuffix = baseUSN ? `${baseUSN}_L01` : "";
          if (!existingInDb.has(usnWithSuffix)) {
            initialSelected.add(s.usn);
          }
        }
      });
      setSelectedUsns(initialSelected);

      const totalStudents = allStudentsList.length;

      if (parsed.errors.length > 0) {
        toast.warning(`File parsed with ${parsed.errors.length} warning(s)`);
      } else {
        toast.success(
          `File parsed successfully! Found ${totalStudents} unique student(s)`,
        );
      }
    } catch (error) {
      toast.error(
        `Error parsing file: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      setBulkFile(null);
      setParsedData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchStudent = async () => {
    if (!searchUsn.trim()) {
      toast.error("Please enter a USN number");
      return;
    }

    setLoading(true);
    try {
      const result = await getStudentByUSN(searchUsn);
      if (result.success && result.data) {
        setFormData(result.data as any);
        toast.success("Student details loaded");
      } else {
        toast.error(result.message);
        // Clear form data if not found to avoid showing stale data
        setFormData({
          studentName: "",
          admissionNumber: "",
          grade: "PREKG",
          section: "A",
          gender: "Male",
          usnNumber: "",
          modeOfTransport: "parent",
          parentCardNumber: "",
          fatherName: "",
          fatherMobile: "",
          motherName: "",
          motherMobile: "",
          dob: "",
          id: "",
        });
      }
    } catch (error) {
      toast.error("An error occurred while fetching student details");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUpload = async () => {
    if (!parsedData) {
      toast.error("Please select and parse a file first");
      return;
    }

    try {
      setLoading(true);

      // Get all parsed students
      const allStudentsList = Object.values(parsedData.students).flat() as any[];

      // Filter by the checked USNs
      const studentsToUpload = allStudentsList.filter((s) => {
        if (!s.usn) return false;
        return selectedUsns.has(s.usn);
      });

      if (studentsToUpload.length === 0) {
        toast.error("Please select at least one student to upload");
        setLoading(false);
        return;
      }

      // Upload to Firebase
      const result = await bulkUploadStudents(studentsToUpload, true);

      setUploadStatus({
        total: studentsToUpload.length,
        uploaded: result.uploaded,
        failed: result.failed,
        errors: result.errors,
      });

      if (result.success) {
        toast.success(`Successfully uploaded ${result.uploaded} student(s)`);
      } else {
        toast.warning(result.message);
      }
    } catch (error) {
      toast.error(
        `Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setLoading(false);
    }
  };

  const resetBulkUpload = () => {
    setBulkFile(null);
    setParsedData(null);
    setSelectedGrade("all");
    setAvailableGrades([]);
    setUploadStatus(null);
    setSelectedUsns(new Set());
    setExistingDatabaseUsns(new Set());
    setFilterSection("all");
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      const event = {
        target: {
          files: [file],
        },
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      handleFileSelect(event);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const getAvailableSections = (): string[] => {
    if (!parsedData) return [];
    
    let studentsList: any[] = [];
    if (selectedGrade === "all") {
      studentsList = Object.values(parsedData.students).flat();
    } else {
      const normalizedGrade = normalizeGrade(selectedGrade);
      studentsList = (normalizedGrade && parsedData.students[normalizedGrade]) || [];
    }
    
    const sectionsSet = new Set<string>();
    studentsList.forEach((s) => {
      if (s.section && s.section !== "nil" && s.section.trim()) {
        sectionsSet.add(s.section.trim().toUpperCase());
      }
    });
    
    return Array.from(sectionsSet).sort();
  };

  const getFilteredStudents = () => {
    if (!parsedData) return [];
    
    let studentsList: any[] = [];
    if (selectedGrade === "all") {
      studentsList = Object.values(parsedData.students).flat();
    } else {
      const normalizedGrade = normalizeGrade(selectedGrade);
      studentsList = (normalizedGrade && parsedData.students[normalizedGrade]) || [];
    }
    
    if (filterSection !== "all") {
      studentsList = studentsList.filter(
        (s) => s.section?.trim().toUpperCase() === filterSection.toUpperCase()
      );
    }
    
    return studentsList;
  };

  const handleGradeChange = (grade: string) => {
    setSelectedGrade(grade);
    setFilterSection("all"); // Reset section filter
  };

  const handleToggleSelectAll = () => {
    const filtered = getFilteredStudents();
    
    // Check if all selectable (non-duplicate) visible students are already selected
    const selectableFiltered = filtered.filter((s) => {
      if (!s.usn) return false;
      const baseUSN = s.usn.trim().replace(/(_L01|_P01)$/, "");
      const usnWithSuffix = baseUSN ? `${baseUSN}_L01` : "";
      return !existingDatabaseUsns.has(usnWithSuffix);
    });

    if (selectableFiltered.length === 0) return;

    const allSelectableAreSelected = selectableFiltered.every((s) => selectedUsns.has(s.usn!));

    const newSelected = new Set(selectedUsns);
    if (allSelectableAreSelected) {
      // Deselect all selectable filtered students
      selectableFiltered.forEach((s) => {
        if (s.usn) newSelected.delete(s.usn);
      });
    } else {
      // Select all selectable filtered students
      selectableFiltered.forEach((s) => {
        if (s.usn) newSelected.add(s.usn);
      });
    }
    setSelectedUsns(newSelected);
  };

  const handleToggleSelectStudent = (usn: string) => {
    const newSelected = new Set(selectedUsns);
    if (newSelected.has(usn)) {
      newSelected.delete(usn);
    } else {
      newSelected.add(usn);
    }
    setSelectedUsns(newSelected);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-4 mb-8 flex-wrap">
        <button
          onClick={() => {
            setMode("add");
            resetBulkUpload();
            resetBulkDelete();
          }}
          className={`flex flex-col items-center gap-2 p-6 rounded-xl transition-all ${
            mode === "add"
              ? "bg-teal-50 border-2 border-teal-500"
              : "bg-white border-2 border-gray-200 hover:border-teal-300"
          }`}
        >
          <UserPlus className="w-8 h-8 text-gray-600" />
          <span className="text-teal-600 font-medium">Add New Student</span>
        </button>
 
        <button
          onClick={() => {
            setMode("bulk");
            resetBulkDelete();
            setFormData({
              studentName: "",
              admissionNumber: "",
              grade: "PREKG",
              section: "A",
              gender: "Male",
              usnNumber: "",
              modeOfTransport: "parent",
              parentCardNumber: "",
              fatherName: "",
              fatherMobile: "",
              motherName: "",
              motherMobile: "",
              dob: "",
              id: "",
            });
          }}
          className={`flex flex-col items-center gap-2 p-6 rounded-xl transition-all ${
            mode === "bulk"
              ? "bg-blue-50 border-2 border-blue-500"
              : "bg-white border-2 border-gray-200 hover:border-blue-300"
          }`}
        >
          <Upload className="w-8 h-8 text-gray-600" />
          <span className="text-blue-600 font-medium">Bulk Upload</span>
        </button>
 
        <button
          onClick={() => {
            setMode("modify");
            setSearchUsn("");
            resetBulkUpload();
            resetBulkDelete();
            setFormData({
              studentName: "",
              admissionNumber: "",
              grade: "PREKG",
              section: "A",
              gender: "Male",
              usnNumber: "",
              modeOfTransport: "parent",
              parentCardNumber: "",
              fatherName: "",
              fatherMobile: "",
              motherName: "",
              motherMobile: "",
              dob: "",
              id: "",
            });
          }}
          className={`flex flex-col items-center gap-2 p-6 rounded-xl transition-all ${
            mode === "modify"
              ? "bg-teal-50 border-2 border-teal-500"
              : "bg-white border-2 border-gray-200 hover:border-teal-300"
          }`}
        >
          <RefreshCw className="w-8 h-8 text-gray-600" />
          <span className="text-teal-600 font-medium">Modify Student</span>
        </button>
 
        <button
          onClick={() => {
            setMode("delete");
            setSearchUsn("");
            setDeleteSubMode("single");
            resetBulkUpload();
            resetBulkDelete();
            setFormData({
              studentName: "",
              admissionNumber: "",
              grade: "PREKG",
              section: "A",
              gender: "Male",
              usnNumber: "",
              modeOfTransport: "parent",
              parentCardNumber: "",
              fatherName: "",
              fatherMobile: "",
              motherName: "",
              motherMobile: "",
              dob: "",
              id: "",
            });
          }}
          className={`flex flex-col items-center gap-2 p-6 rounded-xl transition-all ${
            mode === "delete"
              ? "bg-red-50 border-2 border-red-500"
              : "bg-white border-2 border-gray-200 hover:border-red-300"
          }`}
        >
          <Trash2 className="w-8 h-8 text-gray-600" />
          <span className="text-red-600 font-medium">Delete Data</span>
        </button>
      </div>

      {/* Form Title */}
      <h2 className="text-2xl font-semibold text-center text-gray-800 mb-8">
        {mode === "add"
          ? "Add Student"
          : mode === "bulk"
            ? "Bulk Upload Students"
            : mode === "modify"
              ? "Modify Student"
              : "Delete Student"}
      </h2>

      {/* Single Add/Modify Form */}
      {(mode === "add" || mode === "modify") && (
        <div className="space-y-6">
          {mode === "modify" && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-teal-100 flex items-end gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="searchUsn">SEARCH STUDENT BY USN</Label>
                <Input
                  id="searchUsn"
                  value={searchUsn}
                  onChange={(e) => setSearchUsn(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleFetchStudent();
                    }
                  }}
                  placeholder="Enter USN Number (e.g. NG125003)"
                  className="border-teal-300"
                />
              </div>
              <Button
                onClick={handleFetchStudent}
                className="bg-teal-600 hover:bg-teal-700"
                disabled={loading}
              >
                {loading ? "Searching..." : "Fetch Details"}
              </Button>
            </div>
          )}

          {(mode === "add" || (mode === "modify" && formData.id)) && (
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-xl p-8 shadow-sm border border-gray-100"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="studentName">STUDENT NAME</Label>
                    <Input
                      id="studentName"
                      value={formData.studentName}
                      onChange={(e) =>
                        setFormData({ ...formData, studentName: e.target.value })
                      }
                      placeholder="Enter student name"
                      className="border-teal-300"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="grade">SELECT GRADE</Label>
                    <Select
                      value={formData.grade}
                      onValueChange={(value) =>
                        setFormData({ ...formData, grade: value })
                      }
                    >
                      <SelectTrigger className="border-teal-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {grades.map((grade) => (
                          <SelectItem key={grade} value={grade}>
                            {grade}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender">SELECT GENDER</Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(value) =>
                        setFormData({ ...formData, gender: value })
                      }
                    >
                      <SelectTrigger className="border-teal-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {genders.map((gender) => (
                          <SelectItem key={gender} value={gender}>
                            {gender}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="usnNumber">USN NUMBER</Label>
                    <Input
                      id="usnNumber"
                      value={formData.usnNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, usnNumber: e.target.value })
                      }
                      placeholder="Enter USN number"
                      className="border-teal-300"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dob">DATE OF BIRTH</Label>
                    <Input
                      id="dob"
                      type="date"
                      value={formData.dob}
                      onChange={(e) =>
                        setFormData({ ...formData, dob: e.target.value })
                      }
                      className="border-teal-300"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fatherName">FATHER NAME</Label>
                    <Input
                      id="fatherName"
                      value={formData.fatherName}
                      onChange={(e) =>
                        setFormData({ ...formData, fatherName: e.target.value })
                      }
                      placeholder="Enter father name"
                      className="border-teal-300"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fatherMobile">FATHER MOBILE</Label>
                    <Input
                      id="fatherMobile"
                      type="tel"
                      value={formData.fatherMobile}
                      onChange={(e) =>
                        setFormData({ ...formData, fatherMobile: e.target.value })
                      }
                      placeholder="Enter father mobile"
                      className="border-teal-300"
                    />
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="admissionNumber">ADMISSION NUMBER</Label>
                    <Input
                      id="admissionNumber"
                      value={formData.admissionNumber}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          admissionNumber: e.target.value,
                        })
                      }
                      placeholder="Enter admission number"
                      className="border-teal-300"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="section">SELECT SECTION</Label>
                    <Select
                      value={formData.section}
                      onValueChange={(value) =>
                        setFormData({ ...formData, section: value })
                      }
                    >
                      <SelectTrigger className="border-teal-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {sections.map((section) => (
                          <SelectItem key={section} value={section}>
                            {section}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="transport">SELECT MODE OF TRANSPORT</Label>
                    <Select
                      value={formData.modeOfTransport}
                      onValueChange={(value) =>
                        setFormData({ ...formData, modeOfTransport: value })
                      }
                    >
                      <SelectTrigger className="border-teal-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {transportModes.map((mode) => (
                          <SelectItem key={mode} value={mode}>
                            {mode}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="parentCard">PARENT CARD NUMBER</Label>
                    <Input
                      id="parentCard"
                      value={formData.parentCardNumber}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          parentCardNumber: e.target.value,
                        })
                      }
                      placeholder="Enter parent card number"
                      className="border-teal-300"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="motherName">MOTHER NAME</Label>
                    <Input
                      id="motherName"
                      value={formData.motherName}
                      onChange={(e) =>
                        setFormData({ ...formData, motherName: e.target.value })
                      }
                      placeholder="Enter mother name"
                      className="border-teal-300"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="motherMobile">MOTHER MOBILE</Label>
                    <Input
                      id="motherMobile"
                      type="tel"
                      value={formData.motherMobile}
                      onChange={(e) =>
                        setFormData({ ...formData, motherMobile: e.target.value })
                      }
                      placeholder="Enter mother mobile"
                      className="border-teal-300"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-center">
                <Button
                  type="submit"
                  disabled={loading}
                  className={`px-8 py-3 disabled:opacity-50 ${
                    mode === "modify"
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-teal-500 hover:bg-teal-600"
                  }`}
                >
                  {loading
                    ? "Processing..."
                    : mode === "add"
                      ? "Add Student"
                      : "Save Changes"}
                </Button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Bulk Upload Form */}
      {mode === "bulk" && (
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
          <div className="space-y-6">
            {/* File Upload Section */}
            <div>
              <Label className="text-base font-semibold">
                Upload File (CSV or XLSX)
              </Label>
              <div
                className="mt-4 border-2 border-dashed border-blue-300 rounded-lg p-8 text-center hover:bg-blue-50 transition cursor-pointer"
                onClick={() => {
                  const fileInput = document.getElementById(
                    "fileInput",
                  ) as HTMLInputElement;
                  if (fileInput) fileInput.click();
                }}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                <Upload className="w-12 h-12 text-blue-500 mx-auto mb-2" />
                <p className="text-blue-600 font-medium mb-1">
                  Click to upload
                </p>
                <p className="text-gray-600">or drag and drop</p>
                <input
                  id="fileInput"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileSelect}
                  disabled={loading}
                  className="hidden"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                />
                <p className="text-gray-500 text-sm mt-2">
                  CSV or XLSX files (Max 10MB)
                </p>
              </div>

              {bulkFile && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-700">{bulkFile.name}</p>
                    <p className="text-sm text-gray-600">
                      {(bulkFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                  <button
                    onClick={() => resetBulkUpload()}
                    className="p-2 hover:bg-blue-200 rounded transition"
                    type="button"
                  >
                    <X className="w-5 h-5 text-red-500" />
                  </button>
                </div>
              )}
            </div>

            {/* Grade & Section Filters (Buttons) */}
            {parsedData && (
              <div className="space-y-4 bg-gray-50/50 p-6 rounded-xl border border-gray-100">
                {/* Grade Selection */}
                <div className="space-y-2">
                  <span className="text-sm font-semibold text-gray-700 block">Grade Wise Filter:</span>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant={selectedGrade === "all" ? "default" : "outline"}
                      onClick={() => handleGradeChange("all")}
                      className={`h-9 text-xs rounded-lg transition-all ${
                        selectedGrade === "all" 
                          ? "bg-teal-600 hover:bg-teal-700 text-white shadow-sm font-semibold" 
                          : "hover:bg-gray-100 border-gray-200 font-medium"
                      }`}
                    >
                      All Grades ({getTotalStudents()})
                    </Button>
                    {availableGrades.map((grade) => {
                      const normalized = normalizeGrade(grade);
                      const count = (normalized && parsedData.students[normalized])?.length || 0;
                      return (
                        <Button
                          key={grade}
                          type="button"
                          variant={selectedGrade === grade ? "default" : "outline"}
                          onClick={() => handleGradeChange(grade)}
                          className={`h-9 text-xs rounded-lg transition-all ${
                            selectedGrade === grade 
                              ? "bg-teal-600 hover:bg-teal-700 text-white shadow-sm font-semibold" 
                              : "hover:bg-gray-100 border-gray-200 font-medium"
                          }`}
                        >
                          {grade} ({count})
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* Section Selection */}
                {getAvailableSections().length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-gray-100">
                    <span className="text-sm font-semibold text-gray-700 block">Section Wise Filter:</span>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant={filterSection === "all" ? "default" : "outline"}
                        onClick={() => setFilterSection("all")}
                        className={`h-9 text-xs rounded-lg transition-all ${
                          filterSection === "all" 
                            ? "bg-teal-600 hover:bg-teal-700 text-white shadow-sm font-semibold" 
                            : "hover:bg-gray-100 border-gray-200 font-medium"
                        }`}
                      >
                        All Sections
                      </Button>
                      {getAvailableSections().map((sec) => {
                        // Count how many students in the filtered grade have this section
                        let count = 0;
                        const allList = Object.values(parsedData.students).flat() as any[];
                        if (selectedGrade === "all") {
                          count = allList.filter(s => s.section?.trim().toUpperCase() === sec).length;
                        } else {
                          const normalized = normalizeGrade(selectedGrade);
                          const list = (normalized && parsedData.students[normalized]) || [];
                          count = list.filter(s => s.section?.trim().toUpperCase() === sec).length;
                        }

                        return (
                          <Button
                            key={sec}
                            type="button"
                            variant={filterSection === sec ? "default" : "outline"}
                            onClick={() => setFilterSection(sec)}
                            className={`h-9 text-xs rounded-lg transition-all ${
                              filterSection === sec 
                                ? "bg-teal-600 hover:bg-teal-700 text-white shadow-sm font-semibold" 
                                : "hover:bg-gray-100 border-gray-200 font-medium"
                            }`}
                          >
                            Sec {sec} ({count})
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Selected Students Table */}
            {parsedData && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white px-2 py-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-base font-bold text-gray-800">
                      Students Preview Table
                    </span>
                    <span className="px-2.5 py-1 text-xs font-semibold bg-teal-50 text-teal-700 rounded-full border border-teal-100">
                      Selected: {selectedUsns.size} of {getFilteredStudents().length} visible ({getTotalStudents()} total)
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleToggleSelectAll}
                      className="text-xs font-medium border-teal-200 hover:bg-teal-50 text-teal-700 h-8"
                    >
                      Toggle All Visible
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const allStudentsList = Object.values(parsedData.students).flat() as any[];
                        const newSelected = new Set<string>();
                        allStudentsList.forEach((s) => {
                          if (s.usn) {
                            const baseUSN = s.usn.trim().replace(/(_L01|_P01)$/, "");
                            const usnWithSuffix = baseUSN ? `${baseUSN}_L01` : "";
                            if (!existingDatabaseUsns.has(usnWithSuffix)) {
                              newSelected.add(s.usn);
                            }
                          }
                        });
                        setSelectedUsns(newSelected);
                        toast.success(`Selected all ${newSelected.size} new students`);
                      }}
                      className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8"
                    >
                      Select All New
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedUsns(new Set())}
                      className="text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 h-8"
                    >
                      Deselect All
                    </Button>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                  <div className="max-h-[400px] overflow-y-auto">
                    <table className="w-full text-left border-collapse table-auto">
                      <thead className="bg-gray-50 text-gray-600 text-xs font-semibold uppercase tracking-wider sticky top-0 z-10 shadow-sm border-b border-gray-100">
                        <tr>
                          <th className="px-4 py-3.5 w-12 text-center">
                            <input
                              type="checkbox"
                              className="rounded border-gray-300 text-teal-600 focus:ring-teal-500 h-4 w-4 cursor-pointer"
                              checked={
                                getFilteredStudents().length > 0 &&
                                getFilteredStudents().every((s) => {
                                  if (!s.usn) return true;
                                  const baseUSN = s.usn.trim().replace(/(_L01|_P01)$/, "");
                                  const usnWithSuffix = baseUSN ? `${baseUSN}_L01` : "";
                                  return selectedUsns.has(s.usn) || existingDatabaseUsns.has(usnWithSuffix);
                                })
                              }
                              onChange={handleToggleSelectAll}
                            />
                          </th>
                          <th className="px-4 py-3.5">Student Name</th>
                          <th className="px-4 py-3.5">Admission No</th>
                          <th className="px-4 py-3.5">USN (Barcode)</th>
                          <th className="px-4 py-3.5">Grade</th>
                          <th className="px-4 py-3.5">Section</th>
                          <th className="px-4 py-3.5 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                        {getFilteredStudents().length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                              No students matching current filters
                            </td>
                          </tr>
                        ) : (
                          getFilteredStudents().map((student: any, index: number) => {
                            const baseUSN = student.usn ? student.usn.trim().replace(/(_L01|_P01)$/, "") : "";
                            const usnWithSuffix = baseUSN ? `${baseUSN}_L01` : "";
                            const isDuplicate = existingDatabaseUsns.has(usnWithSuffix);
                            const isSelected = selectedUsns.has(student.usn);

                            return (
                              <tr 
                                key={student.usn || index} 
                                className={`hover:bg-gray-50/80 transition-colors ${
                                  isDuplicate ? "bg-red-50/10" : isSelected ? "bg-teal-50/5" : ""
                                }`}
                              >
                                <td className="px-4 py-3 w-12 text-center">
                                  <input
                                    type="checkbox"
                                    className="rounded border-gray-300 text-teal-600 focus:ring-teal-500 h-4 w-4 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                    checked={isSelected}
                                    disabled={isDuplicate}
                                    onChange={() => student.usn && handleToggleSelectStudent(student.usn)}
                                  />
                                </td>
                                <td className="px-4 py-3 font-medium text-gray-900">{student.name}</td>
                                <td className="px-4 py-3 text-gray-600">{student.admissionNumber || "N/A"}</td>
                                <td className="px-4 py-3 font-mono text-xs text-gray-600">{student.usn || "N/A"}</td>
                                <td className="px-4 py-3"><span className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-700">{student.grade}</span></td>
                                <td className="px-4 py-3"><span className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-700">{student.section || "nil"}</span></td>
                                <td className="px-4 py-3 text-center">
                                  {isDuplicate ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200 shadow-sm">
                                      <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                                      In Database
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200 shadow-sm">
                                      <Check className="w-3.5 h-3.5 text-green-600" />
                                      Ready
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Warnings and Parsing Info */}
            {parsedData && parsedData.errors.length > 0 && (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg flex gap-3">
                <Info className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-orange-800 text-sm mb-1">
                    Parsing Warnings ({parsedData.errors.length}):
                  </p>
                  <ul className="text-xs text-orange-700 space-y-1 max-h-24 overflow-y-auto">
                    {parsedData.errors.map((err: string, i: number) => (
                      <li key={i}>• {err}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Upload Status */}
            {uploadStatus && (
              <div
                className={`p-5 rounded-xl border ${
                  uploadStatus.failed === 0
                    ? "bg-green-50 border-green-200 text-green-800"
                    : "bg-orange-50 border-orange-200 text-orange-800"
                }`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-base font-bold">
                    {uploadStatus.failed === 0
                      ? "✓ Upload Successful"
                      : "⚠ Upload Completed with Skipped Records / Errors"}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center mb-4 bg-white/50 p-3 rounded-lg border border-current/10">
                  <div>
                    <span className="block text-xs uppercase tracking-wider text-gray-500 font-semibold">Total Attempted</span>
                    <span className="text-xl font-bold text-gray-800">{uploadStatus.total}</span>
                  </div>
                  <div>
                    <span className="block text-xs uppercase tracking-wider text-green-600 font-semibold">Successfully Added</span>
                    <span className="text-xl font-bold text-green-700">{uploadStatus.uploaded}</span>
                  </div>
                  <div>
                    <span className="block text-xs uppercase tracking-wider text-red-500 font-semibold">Skipped / Failed</span>
                    <span className="text-xl font-bold text-red-700">{uploadStatus.failed}</span>
                  </div>
                </div>

                {uploadStatus.errors.length > 0 && (
                  <div className="mt-3">
                    <p className="font-bold text-sm mb-2 text-gray-700">Detailed Skip Log / Errors:</p>
                    <div className="max-h-40 overflow-y-auto bg-white rounded-lg border border-gray-200 p-3 shadow-inner">
                      <ul className="text-xs text-gray-600 space-y-1.5 font-mono">
                        {uploadStatus.errors.map((error, idx) => (
                          <li key={idx} className="flex gap-2">
                            <span className="text-red-500 font-bold">•</span>
                            <span>{error}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center">
              {parsedData && !uploadStatus && (
                <Button
                  onClick={handleBulkUpload}
                  disabled={loading || selectedUsns.size === 0}
                  className="px-8 py-3 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 font-semibold"
                >
                  {loading ? "Uploading..." : `Upload Selected (${selectedUsns.size}) to Firebase`}
                </Button>
              )}

              {uploadStatus && (
                <Button
                  onClick={resetBulkUpload}
                  className="px-8 py-3 bg-gray-500 hover:bg-gray-600 font-semibold"
                >
                  Upload Another File
                </Button>
              )}

              {!parsedData && (
                <p className="text-gray-500">Select a file to begin</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Section */}
      {mode === "delete" && (
        <div className="space-y-6">
          {/* Sub-mode Selection */}
          <div className="flex justify-center gap-2 mb-6 border-b border-gray-100 pb-4">
            <Button
              type="button"
              variant={deleteSubMode === "single" ? "default" : "outline"}
              onClick={() => {
                setDeleteSubMode("single");
                resetBulkDelete();
              }}
              className={`h-9 px-4 text-xs rounded-lg transition-all ${
                deleteSubMode === "single"
                  ? "bg-red-600 hover:bg-red-700 text-white font-semibold shadow-sm"
                  : "hover:bg-gray-100 border-gray-200 text-gray-700 font-medium"
              }`}
            >
              Delete Single Student
            </Button>
            <Button
              type="button"
              variant={deleteSubMode === "bulk" ? "default" : "outline"}
              onClick={() => {
                setDeleteSubMode("bulk");
                setSearchUsn("");
                setFormData({
                  studentName: "",
                  admissionNumber: "",
                  grade: "PREKG",
                  section: "A",
                  gender: "Male",
                  usnNumber: "",
                  modeOfTransport: "parent",
                  parentCardNumber: "",
                  fatherName: "",
                  fatherMobile: "",
                  motherName: "",
                  motherMobile: "",
                  dob: "",
                  id: "",
                });
              }}
              className={`h-9 px-4 text-xs rounded-lg transition-all ${
                deleteSubMode === "bulk"
                  ? "bg-red-600 hover:bg-red-700 text-white font-semibold shadow-sm"
                  : "hover:bg-gray-100 border-gray-200 text-gray-700 font-medium"
              }`}
            >
              Bulk Delete (TC List)
            </Button>
          </div>

          {deleteSubMode === "single" ? (
            <div className="space-y-6">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-red-100 flex items-end gap-4">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="deleteUsn">SEARCH STUDENT TO DELETE BY USN</Label>
                  <Input
                    id="deleteUsn"
                    value={searchUsn}
                    onChange={(e) => setSearchUsn(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleFetchStudent();
                      }
                    }}
                    placeholder="Enter USN Number to delete"
                    className="border-red-300"
                  />
                </div>
                <Button
                  onClick={handleFetchStudent}
                  className="bg-red-600 hover:bg-red-700"
                  disabled={loading}
                >
                  {loading ? "Searching..." : "Find Student"}
                </Button>
              </div>

              {formData.usnNumber && (
                <div className="bg-white rounded-xl p-8 shadow-sm border border-red-200">
                  <h3 className="text-xl font-bold text-red-700 mb-4 uppercase text-center">
                    Confirm Deletion
                  </h3>
                  <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-red-50 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-500 uppercase">
                        Student Name
                      </p>
                      <p className="font-semibold">{formData.studentName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 uppercase">USN Number</p>
                      <p className="font-semibold">{formData.usnNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 uppercase">
                        Grade & Section
                      </p>
                      <p className="font-semibold">
                        {formData.grade} - {formData.section}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 uppercase">
                        Admission Number
                      </p>
                      <p className="font-semibold">{formData.admissionNumber}</p>
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex gap-3 italic text-amber-800">
                    <X className="w-5 h-5 flex-shrink-0" />
                    <p>
                      Warning: This action is permanent and cannot be undone. All
                      student records associated with this USN will be removed.
                    </p>
                  </div>

                  <div className="flex justify-center gap-4">
                    <Button
                      onClick={() => {
                        setSearchUsn("");
                        setFormData({ ...formData, usnNumber: "" });
                      }}
                      variant="outline"
                      className="px-8"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={(e) => {
                        if (
                          confirm(
                            `Are you absolutely sure you want to delete ${formData.studentName}?`,
                          )
                        ) {
                          handleSubmit(e as any);
                        }
                      }}
                      className="bg-red-600 hover:bg-red-700 px-8"
                      disabled={loading}
                    >
                      {loading ? "Deleting..." : "Delete Permanently"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Bulk Delete File Area */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-red-100">
                {!deleteFile ? (
                  <div className="flex flex-col items-center justify-center border-2 border-dashed border-red-200 rounded-xl p-10 bg-red-50/5 hover:bg-red-50/10 hover:border-red-300 transition-all cursor-pointer relative">
                    <input
                      type="file"
                      accept=".xlsx, .xls, .csv"
                      onChange={handleDeleteFileSelect}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      disabled={loading}
                    />
                    <Upload className="h-10 w-10 text-red-400 mb-3" />
                    <p className="text-sm font-semibold text-gray-700 mb-1">
                      Upload TC List Excel File
                    </p>
                    <p className="text-xs text-gray-400">
                      Must contain a sheet named 'Transfer Certificate 2025-26'
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-4 bg-red-50/20 border border-red-100 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                        <Upload className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-gray-800">{deleteFile.name}</p>
                        <p className="text-xs text-gray-500">{(deleteFile.size / 1024).toFixed(2)} KB</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={resetBulkDelete}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      disabled={loading}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                )}
              </div>

              {parsedDeleteData && parsedDeleteData.deleteStudents && (
                <div className="space-y-4">
                  {/* Selection Stats and Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 text-xs font-semibold bg-red-50 text-red-700 rounded-full border border-red-100">
                        To Delete: {selectedDeleteUsns.size} of {parsedDeleteData.deleteStudents.length} students
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const allUsns = parsedDeleteData.deleteStudents.map((s: any) => s.usn).filter(Boolean);
                          const allSelected = allUsns.every((u: string) => selectedDeleteUsns.has(u));
                          if (allSelected) {
                            setSelectedDeleteUsns(new Set());
                          } else {
                            setSelectedDeleteUsns(new Set(allUsns));
                          }
                        }}
                        className="text-xs font-medium border-red-200 hover:bg-red-50 text-red-750 h-8"
                      >
                        Toggle All
                      </Button>
                    </div>
                  </div>

                  {/* Student Table */}
                  <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                    <div className="max-h-[350px] overflow-y-auto">
                      <table className="w-full text-left border-collapse table-auto">
                        <thead className="bg-red-50/50 text-red-800 text-xs font-semibold uppercase tracking-wider sticky top-0 z-10 border-b border-red-100 shadow-sm bg-white">
                          <tr>
                            <th className="px-4 py-3 w-12 text-center">
                              <input
                                type="checkbox"
                                className="rounded border-red-300 text-red-600 focus:ring-red-500 h-4 w-4 cursor-pointer"
                                checked={
                                  parsedDeleteData.deleteStudents.length > 0 &&
                                  parsedDeleteData.deleteStudents.every((s: any) => selectedDeleteUsns.has(s.usn))
                                }
                                onChange={() => {
                                  const allUsns = parsedDeleteData.deleteStudents.map((s: any) => s.usn).filter(Boolean);
                                  const allSelected = allUsns.every((u: string) => selectedDeleteUsns.has(u));
                                  if (allSelected) {
                                    setSelectedDeleteUsns(new Set());
                                  } else {
                                    setSelectedDeleteUsns(new Set(allUsns));
                                  }
                                }}
                              />
                            </th>
                            <th className="px-4 py-3">Student Name</th>
                            <th className="px-4 py-3">USN (Barcode)</th>
                            <th className="px-4 py-3">Grade</th>
                            <th className="px-4 py-3">Section</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-red-100/50 text-sm text-gray-700">
                          {parsedDeleteData.deleteStudents.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                                No students found for deletion.
                              </td>
                            </tr>
                          ) : (
                            parsedDeleteData.deleteStudents.map((student: any, idx: number) => {
                              const isChecked = selectedDeleteUsns.has(student.usn);
                              return (
                                <tr
                                  key={student.usn || idx}
                                  className={`hover:bg-red-50/20 transition-colors ${isChecked ? "bg-red-50/10" : ""}`}
                                >
                                  <td className="px-4 py-3 text-center">
                                    <input
                                      type="checkbox"
                                      className="rounded border-red-300 text-red-600 focus:ring-red-500 h-4 w-4 cursor-pointer"
                                      checked={isChecked}
                                      onChange={() => {
                                        const newSelected = new Set(selectedDeleteUsns);
                                        if (newSelected.has(student.usn)) {
                                          newSelected.delete(student.usn);
                                        } else {
                                          newSelected.add(student.usn);
                                        }
                                        setSelectedDeleteUsns(newSelected);
                                      }}
                                    />
                                  </td>
                                  <td className="px-4 py-3 font-semibold text-gray-800">{student.name}</td>
                                  <td className="px-4 py-3 text-red-600 font-mono text-xs">{student.usn}</td>
                                  <td className="px-4 py-3">{student.grade || "N/A"}</td>
                                  <td className="px-4 py-3 uppercase">{student.section || "N/A"}</td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Danger Alert Warning */}
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3 text-red-800">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-600" />
                    <div className="text-sm">
                      <p className="font-semibold text-red-950 mb-0.5">Critical Danger Warning</p>
                      <p>
                        This action will permanently delete all records of the selected {selectedDeleteUsns.size} student(s) from the database. This cannot be undone.
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-center gap-4 pt-4">
                    <Button
                      onClick={resetBulkDelete}
                      variant="outline"
                      className="px-8 py-3 font-semibold"
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleBulkDelete}
                      className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold shadow-sm"
                      disabled={loading}
                    >
                      {loading ? "Deleting..." : `Delete ${selectedDeleteUsns.size} Students Permanently`}
                    </Button>
                  </div>
                </div>
              )}

              {/* Warnings and Diagnostics */}
              {parsedDeleteData && parsedDeleteData.errors && parsedDeleteData.errors.length > 0 && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl space-y-2">
                  <h4 className="text-sm font-semibold text-yellow-800 flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    Parsing Warnings ({parsedDeleteData.errors.length}):
                  </h4>
                  <ul className="text-xs text-yellow-700 list-disc pl-5 space-y-1 max-h-48 overflow-y-auto">
                    {parsedDeleteData.errors.map((err: string, i: number) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );

  function getTotalStudents(): number {
    if (!parsedData) return 0;
    return Object.values(parsedData.students).reduce(
      (sum: number, students: any) =>
        sum + (Array.isArray(students) ? students.length : 0),
      0,
    );
  }
}
