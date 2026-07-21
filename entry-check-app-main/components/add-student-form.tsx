"use client";

import type React from "react";
import { useState } from "react";
import { UserPlus, RefreshCw, Trash2, Upload, Search, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { grades } from "@/lib/data";
import {
  addStudentToFirestore,
  bulkUploadStudents,
  getStudentByUSN,
  updateStudentInFirestore,
  deleteStudentFromFirestore,
} from "@/lib/firestore-service";
import { parseCSV, parseXLSX } from "@/lib/file-parser";
import { toast } from "sonner";
import { useStudentsContext } from "@/contexts/students-context";

type FormMode = "add" | "modify" | "delete" | "bulk";

export function AddStudentForm() {
  const { students, invalidateStudentsCache } = useStudentsContext();
  const [mode, setMode] = useState<FormMode>("add");
  const [loading, setLoading] = useState(false);
  const [searchUsn, setSearchUsn] = useState("");
  
  const [formData, setFormData] = useState({
    studentName: "",
    grade: "PREKG",
    usnNumber: "",
    id: "",
  });

  // Bulk upload states
  const [bulkFile, setBulkFile] = useState<File | null>(null);
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
          invalidateStudentsCache();
          setFormData({ studentName: "", grade: "PREKG", usnNumber: "", id: "" });
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
          invalidateStudentsCache();
        } else {
          toast.error(result.message);
        }
      } else if (mode === "delete") {
        if (!formData.id) {
          toast.error("Please fetch a student first");
          setLoading(false);
          return;
        }
        if (!confirm("Are you sure you want to delete this student?")) {
          setLoading(false);
          return;
        }
        const result = await deleteStudentFromFirestore(formData.id);
        if (result.success) {
          toast.success(result.message);
          invalidateStudentsCache();
          setFormData({ studentName: "", grade: "PREKG", usnNumber: "", id: "" });
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
    if (!file) return;

    try {
      setLoading(true);
      setUploadStatus(null);
      setParsedData(null);

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

      setBulkFile(file);
      setParsedData(parsed);

      const allStudentsList = Object.values(parsed.students).flat() as any[];
      const totalStudents = allStudentsList.length;

      if (parsed.errors && parsed.errors.length > 0) {
        toast.warning(`File parsed with ${parsed.errors.length} warning(s)`);
      } else {
        toast.success(`File parsed successfully! Found ${totalStudents} unique student(s)`);
      }
    } catch (error) {
      toast.error(`Error parsing file: ${error instanceof Error ? error.message : "Unknown error"}`);
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
      const result = await getStudentByUSN(searchUsn, students);
      if (result.success && result.data) {
        setFormData({
          studentName: result.data.studentName,
          grade: result.data.grade,
          usnNumber: result.data.usnNumber,
          id: result.data.id || "",
        });
        toast.success("Student details loaded");
      } else {
        toast.error(result.message);
        setFormData({ studentName: "", grade: "PREKG", usnNumber: "", id: "" });
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
      const allStudentsList = Object.values(parsedData.students).flat() as any[];

      if (allStudentsList.length === 0) {
        toast.error("No valid students found in file");
        setLoading(false);
        return;
      }

      const result = await bulkUploadStudents(allStudentsList, true, students);

      setUploadStatus({
        total: allStudentsList.length,
        uploaded: result.uploaded,
        failed: result.failed,
        errors: result.errors,
      });

      if (result.success) {
        toast.success(`Successfully uploaded ${result.uploaded} student(s)`);
        invalidateStudentsCache();
      } else {
        toast.warning(result.message);
      }
    } catch (error) {
      toast.error(`Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Database Management</h1>
        <p className="text-gray-500 mt-2">Manage student records securely. Updates apply immediately to the central system.</p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => { setMode("add"); setFormData({ studentName: "", grade: "PREKG", usnNumber: "", id: "" }); }}
          className={`flex items-center gap-2 px-6 py-3 font-medium text-sm transition-colors ${
            mode === "add" ? "border-b-2 border-nest-600 text-nest-700" : "text-gray-500 hover:text-gray-900"
          }`}
        >
          <UserPlus className="w-4 h-4" /> Add Record
        </button>
        <button
          onClick={() => { setMode("modify"); setSearchUsn(""); setFormData({ studentName: "", grade: "PREKG", usnNumber: "", id: "" }); }}
          className={`flex items-center gap-2 px-6 py-3 font-medium text-sm transition-colors ${
            mode === "modify" ? "border-b-2 border-nest-600 text-nest-700" : "text-gray-500 hover:text-gray-900"
          }`}
        >
          <RefreshCw className="w-4 h-4" /> Modify Record
        </button>
        <button
          onClick={() => { setMode("bulk"); setParsedData(null); setBulkFile(null); }}
          className={`flex items-center gap-2 px-6 py-3 font-medium text-sm transition-colors ${
            mode === "bulk" ? "border-b-2 border-nest-600 text-nest-700" : "text-gray-500 hover:text-gray-900"
          }`}
        >
          <Upload className="w-4 h-4" /> Bulk Upload
        </button>
        <button
          onClick={() => { setMode("delete"); setSearchUsn(""); setFormData({ studentName: "", grade: "PREKG", usnNumber: "", id: "" }); }}
          className={`flex items-center gap-2 px-6 py-3 font-medium text-sm transition-colors ${
            mode === "delete" ? "border-b-2 border-red-600 text-red-600" : "text-gray-500 hover:text-red-600"
          }`}
        >
          <Trash2 className="w-4 h-4" /> Delete Record
        </button>
      </div>

      {/* Main Content Area */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 md:p-8">
        {/* Search Bar for Modify & Delete */}
        {(mode === "modify" || mode === "delete") && (
          <div className="flex gap-4 mb-8 pb-8 border-b border-gray-100">
            <div className="flex-1">
              <Label htmlFor="searchUsn" className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                Find Student by USN or Name
              </Label>
              <Input
                id="searchUsn"
                value={searchUsn}
                onChange={(e) => setSearchUsn(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleFetchStudent()}
                placeholder="e.g. NP25026 or John Doe"
                className="w-full bg-gray-50 border-gray-200 focus:bg-white"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleFetchStudent} disabled={loading} className="bg-nest-600 text-white hover:bg-nest-700 px-8">
                {loading ? "Searching..." : <><Search className="w-4 h-4 mr-2" /> Search</>}
              </Button>
            </div>
          </div>
        )}

        {/* Form for Add/Modify/Delete */}
        {mode !== "bulk" && (
          <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
            <div className="space-y-4">
              <div>
                <Label htmlFor="studentName" className="text-sm font-medium text-gray-700">Student Name</Label>
                <Input
                  id="studentName"
                  value={formData.studentName}
                  onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                  placeholder="Full Name"
                  disabled={mode === "delete"}
                  className="mt-1 bg-gray-50 border-gray-200 focus:bg-white"
                  required
                />
              </div>

              <div>
                <Label htmlFor="usnNumber" className="text-sm font-medium text-gray-700">USN Number</Label>
                <Input
                  id="usnNumber"
                  value={formData.usnNumber}
                  onChange={(e) => setFormData({ ...formData, usnNumber: e.target.value })}
                  placeholder="Unique Student Number"
                  disabled={mode === "delete"}
                  className="mt-1 bg-gray-50 border-gray-200 focus:bg-white"
                  required
                />
              </div>

              <div>
                <Label htmlFor="grade" className="text-sm font-medium text-gray-700">Grade</Label>
                <Select
                  value={formData.grade}
                  onValueChange={(value) => setFormData({ ...formData, grade: value })}
                  disabled={mode === "delete"}
                >
                  <SelectTrigger className="mt-1 bg-gray-50 border-gray-200 focus:bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {grades.map((grade) => (
                      <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-2">Segment will be automatically calculated and assigned based on the selected Grade.</p>
              </div>
            </div>

            <div className="pt-4">
              {mode === "add" && (
                <Button type="submit" disabled={loading} className="w-full sm:w-auto bg-nest-600 text-white hover:bg-nest-700 px-8">
                  {loading ? "Adding..." : "Add Student Record"}
                </Button>
              )}
              {mode === "modify" && formData.id && (
                <Button type="submit" disabled={loading} className="w-full sm:w-auto bg-nest-600 text-white hover:bg-nest-700 px-8">
                  {loading ? "Updating..." : "Save Changes"}
                </Button>
              )}
              {mode === "delete" && formData.id && (
                <Button type="submit" disabled={loading} variant="destructive" className="w-full sm:w-auto px-8">
                  {loading ? "Deleting..." : "Permanently Delete Record"}
                </Button>
              )}
            </div>
          </form>
        )}

        {/* Bulk Upload Area */}
        {mode === "bulk" && (
          <div className="space-y-6">
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-12 text-center bg-gray-50 hover:bg-gray-100 transition-colors">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-4" />
              <p className="text-sm text-gray-600 mb-4">Upload CSV or XLSX file</p>
              <p className="text-xs text-gray-500 mb-6 max-w-sm mx-auto">File must contain columns: Sno, NAME, USN, GRADE, SEGMENT (Segment is optional, will auto-calculate if missing)</p>
              <Label
                htmlFor="file-upload"
                className="cursor-pointer bg-white border border-gray-200 text-gray-900 px-6 py-2 rounded-md font-medium text-sm hover:bg-gray-50 transition-colors inline-block"
              >
                Browse Files
              </Label>
              <Input
                id="file-upload"
                type="file"
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>

            {bulkFile && parsedData && (
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-gray-900">File Ready for Upload</h3>
                    <p className="text-sm text-gray-500">{bulkFile.name}</p>
                  </div>
                  <Button onClick={handleBulkUpload} disabled={loading} className="bg-nest-600 text-white hover:bg-nest-700">
                    {loading ? "Uploading..." : "Confirm & Upload"}
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm pt-4 border-t border-gray-200">
                  <div>
                    <span className="text-gray-500">Total Valid Records:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {Object.values(parsedData.students).flat().length}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Unique Grades Found:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {parsedData.grades.length}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {uploadStatus && (
              <div className={`p-6 rounded-lg border ${uploadStatus.failed > 0 ? "bg-red-50 border-red-100" : "bg-green-50 border-green-100"}`}>
                <div className="flex items-start gap-3">
                  {uploadStatus.failed > 0 ? (
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  ) : (
                    <Check className="w-5 h-5 text-green-600 mt-0.5" />
                  )}
                  <div>
                    <h3 className={`font-semibold ${uploadStatus.failed > 0 ? "text-red-900" : "text-green-900"}`}>
                      Upload Complete
                    </h3>
                    <ul className={`mt-2 text-sm ${uploadStatus.failed > 0 ? "text-red-700" : "text-green-700"} space-y-1`}>
                      <li>Total processed: {uploadStatus.total}</li>
                      <li>Successfully uploaded: {uploadStatus.uploaded}</li>
                      {uploadStatus.failed > 0 && <li>Failed/Skipped: {uploadStatus.failed}</li>}
                    </ul>
                    
                    {uploadStatus.errors.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-red-200">
                        <p className="text-sm font-medium text-red-900 mb-2">Error Details:</p>
                        <div className="max-h-40 overflow-y-auto bg-white rounded p-3 text-xs text-red-800 space-y-1 border border-red-100">
                          {uploadStatus.errors.map((err, i) => (
                            <p key={i} className="whitespace-pre-wrap">{err}</p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
