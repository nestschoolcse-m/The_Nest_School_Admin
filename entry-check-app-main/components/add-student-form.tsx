"use client";

import type React from "react";

import { useState } from "react";
import { UserPlus, RefreshCw, Trash2, User, Upload, X } from "lucide-react";
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
    grade: "PRE-KG",
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
            grade: "PRE-KG",
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
          });
        } else {
          toast.error(result.message);
        }
      } else if (mode === "modify") {
        const result = await updateStudentInFirestore(originalUsn, formData);
        if (result.success) {
          toast.success(result.message);
          // Don't reset form in modify mode so user can see their changes
        } else {
          toast.error(result.message);
        }
      } else if (mode === "delete") {
        const result = await deleteStudentFromFirestore(formData.usnNumber);
        if (result.success) {
          toast.success(result.message);
          setFormData({
            studentName: "",
            admissionNumber: "",
            grade: "PRE-KG",
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
          });
          setSearchUsn("");
        } else {
          toast.error(result.message);
        }
      }
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      console.log("No file selected");
      return;
    }

    console.log("File selected:", file.name, file.size);

    try {
      setLoading(true);
      setUploadStatus(null);
      setParsedData(null);

      // Parse file based on type
      let parsed;
      if (file.name.endsWith(".csv")) {
        console.log("Parsing as CSV");
        parsed = await parseCSV(file);
      } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
        console.log("Parsing as XLSX");
        parsed = await parseXLSX(file);
      } else {
        toast.error("Please upload a CSV or XLSX file");
        setBulkFile(null);
        setLoading(false);
        return;
      }

      console.log("Parsed data:", parsed);

      setBulkFile(file);
      setParsedData(parsed);
      setAvailableGrades(parsed.grades);
      setSelectedGrade("all");

      const totalStudents = Object.values(parsed.students).reduce(
        (sum: number, students: any) =>
          sum + (Array.isArray(students) ? students.length : 0),
        0,
      );

      if (parsed.errors.length > 0) {
        toast.warning(`File parsed with ${parsed.errors.length} warning(s)`);
      } else {
        toast.success(
          `File parsed successfully! Found ${totalStudents} students`,
        );
      }
    } catch (error) {
      console.error("Error parsing file:", error);
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
        setOriginalUsn(result.data.usnNumber);
        toast.success("Student details loaded");
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error fetching student:", error);
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

      // Get students to upload based on selected grade
      let studentsToUpload: any[] = [];
      if (selectedGrade === "all") {
        studentsToUpload = Object.values(parsedData.students).flat();
      } else {
        const normalizedGrade = normalizeGrade(selectedGrade);
        studentsToUpload = (normalizedGrade && parsedData && parsedData.students[normalizedGrade]) || [];
      }

      if (studentsToUpload.length === 0) {
        toast.error("No students to upload for the selected grade");
        return;
      }

      // Upload to Firebase
      const result = await bulkUploadStudents(studentsToUpload);

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

  return (
    <div className="max-w-4xl mx-auto">
      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-4 mb-8 flex-wrap">
        <button
          onClick={() => {
            setMode("add");
            resetBulkUpload();
          }}
          className={`flex flex-col items-center gap-2 p-6 rounded-xl transition-all ${mode === "add"
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
            setFormData({
              studentName: "",
              admissionNumber: "",
              grade: "PRE-KG",
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
            });
          }}
          className={`flex flex-col items-center gap-2 p-6 rounded-xl transition-all ${mode === "bulk"
            ? "bg-blue-50 border-2 border-blue-500"
            : "bg-white border-2 border-gray-200 hover:border-blue-300"
            }`}
        >
          <Upload className="w-8 h-8 text-gray-600" />
          <span className="text-blue-600 font-medium">Bulk Upload</span>
        </button>

        <button
          onClick={() => setMode("modify")}
          className={`flex flex-col items-center gap-2 p-6 rounded-xl transition-all ${mode === "modify"
            ? "bg-teal-50 border-2 border-teal-500"
            : "bg-white border-2 border-gray-200 hover:border-teal-300"
            }`}
        >
          <RefreshCw className="w-8 h-8 text-gray-600" />
          <span className="text-teal-600 font-medium">Modify Student</span>
        </button>

        <button
          onClick={() => setMode("delete")}
          className={`flex flex-col items-center gap-2 p-6 rounded-xl transition-all ${mode === "delete"
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

          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-xl p-8 shadow-sm border border-gray-100"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Student Photo */}
                <div className="flex flex-col items-center">
                  <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center mb-2">
                    <User className="w-12 h-12 text-gray-400" />
                  </div>
                  <span className="text-sm text-gray-500">STUDENT PHOTO</span>
                </div>

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
                {/* Parent Photo */}
                <div className="flex flex-col items-center">
                  <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center mb-2">
                    <UserPlus className="w-12 h-12 text-gray-400" />
                  </div>
                  <span className="text-sm text-gray-500">PARENT PHOTO</span>
                </div>

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
                className={`px-8 py-3 disabled:opacity-50 ${mode === "modify" ? "bg-blue-600 hover:bg-blue-700" : "bg-teal-500 hover:bg-teal-600"
                  }`}
              >
                {loading ? "Processing..." : mode === "add" ? "Add Student" : "Modify Student"}
              </Button>
            </div>
          </form>
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

            {/* Grade Selection */}
            {parsedData && availableGrades.length > 0 && (
              <div>
                <Label
                  htmlFor="gradeSelect"
                  className="text-base font-semibold"
                >
                  Select Grade to Upload
                </Label>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Select
                      value={selectedGrade}
                      onValueChange={setSelectedGrade}
                    >
                      <SelectTrigger className="border-teal-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          All Grades ({getTotalStudents().toString()})
                        </SelectItem>
                        {availableGrades.map((grade) => (
                          <SelectItem key={grade} value={grade}>
                            {grade} (
                            {(parsedData.students[grade] as any[])?.length || 0}{" "}
                            students)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Parsing Status */}
            {parsedData && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-700 mb-2">
                  Parsing Summary:
                </p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>
                    • Total Students:{" "}
                    <span className="font-medium">
                      {getTotalStudents().toString()}
                    </span>
                  </li>
                  <li>
                    • Grades Found:{" "}
                    <span className="font-medium">
                      {availableGrades.length}
                    </span>
                  </li>
                  {parsedData.errors.length > 0 && (
                    <li>
                      • Warnings:{" "}
                      <span className="font-medium text-orange-600">
                        {parsedData.errors.length}
                      </span>
                    </li>
                  )}
                </ul>
              </div>
            )}

            {/* Upload Status */}
            {uploadStatus && (
              <div
                className={`p-4 rounded-lg ${uploadStatus.failed === 0
                  ? "bg-green-50 border border-green-200"
                  : "bg-orange-50 border border-orange-200"
                  }`}
              >
                <p className="font-medium mb-2">
                  {uploadStatus.failed === 0
                    ? "✓ Upload Successful"
                    : "⚠ Upload Completed with Errors"}
                </p>
                <ul className="text-sm space-y-1">
                  <li>
                    Total Records:{" "}
                    <span className="font-medium">{uploadStatus.total}</span>
                  </li>
                  <li>
                    Successfully Uploaded:{" "}
                    <span className="font-medium text-green-600">
                      {uploadStatus.uploaded}
                    </span>
                  </li>
                  {uploadStatus.failed > 0 && (
                    <li>
                      Failed:{" "}
                      <span className="font-medium text-red-600">
                        {uploadStatus.failed}
                      </span>
                    </li>
                  )}
                </ul>

                {uploadStatus.errors.length > 0 && (
                  <div className="mt-3 max-h-48 overflow-y-auto">
                    <p className="font-medium text-sm mb-2">Error Details:</p>
                    <ul className="text-xs text-gray-700 space-y-1">
                      {uploadStatus.errors.slice(0, 10).map((error, idx) => (
                        <li key={idx} className="text-red-600">
                          • {error}
                        </li>
                      ))}
                      {uploadStatus.errors.length > 10 && (
                        <li className="text-gray-600">
                          • ... and {uploadStatus.errors.length - 10} more
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center">
              {parsedData && !uploadStatus && (
                <Button
                  onClick={handleBulkUpload}
                  disabled={loading}
                  className="px-8 py-3 bg-blue-500 hover:bg-blue-600 disabled:opacity-50"
                >
                  {loading ? "Uploading..." : "Upload to Firebase"}
                </Button>
              )}

              {uploadStatus && (
                <Button
                  onClick={resetBulkUpload}
                  className="px-8 py-3 bg-gray-500 hover:bg-gray-600"
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
          <div className="bg-white rounded-xl p-6 shadow-sm border border-red-100 flex items-end gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="deleteUsn">SEARCH STUDENT TO DELETE BY USN</Label>
              <Input
                id="deleteUsn"
                value={searchUsn}
                onChange={(e) => setSearchUsn(e.target.value)}
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
              <h3 className="text-xl font-bold text-red-700 mb-4 uppercase text-center">Confirm Deletion</h3>
              <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-red-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500 uppercase">Student Name</p>
                  <p className="font-semibold">{formData.studentName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 uppercase">USN Number</p>
                  <p className="font-semibold">{formData.usnNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 uppercase">Grade & Section</p>
                  <p className="font-semibold">{formData.grade} - {formData.section}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 uppercase">Admission Number</p>
                  <p className="font-semibold">{formData.admissionNumber}</p>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex gap-3 italic text-amber-800">
                <X className="w-5 h-5 flex-shrink-0" />
                <p>Warning: This action is permanent and cannot be undone. All student records associated with this USN will be removed.</p>
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
                    if (confirm(`Are you absolutely sure you want to delete ${formData.studentName}?`)) {
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
