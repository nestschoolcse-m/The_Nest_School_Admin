"use client"

import type React from "react"

import { useState } from "react"
import { UserPlus, RefreshCw, Trash2, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { grades, sections, genders, transportModes } from "@/lib/data"

type FormMode = "add" | "modify" | "delete"

export function AddStudentForm() {
  const [mode, setMode] = useState<FormMode>("add")
  const [formData, setFormData] = useState({
    studentName: "",
    admissionNumber: "",
    grade: "PRE-KG",
    section: "A",
    gender: "Male",
    usnNumber: "",
    modeOfTransport: "parent",
    parentCardNumber: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission - connect to backend later
    console.log("Form submitted:", formData)
    alert(`Student ${mode === "add" ? "added" : mode === "modify" ? "modified" : "deleted"} successfully!`)
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-8 mb-8">
        <button
          onClick={() => setMode("add")}
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
          onClick={() => setMode("modify")}
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
          onClick={() => setMode("delete")}
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
        {mode === "add" ? "Add Student" : mode === "modify" ? "Modify Student" : "Delete Student"}
      </h2>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
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
                onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                placeholder="Enter student name"
                className="border-teal-300"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="grade">SELECT GRADE</Label>
              <Select value={formData.grade} onValueChange={(value) => setFormData({ ...formData, grade: value })}>
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
              <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
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
                onChange={(e) => setFormData({ ...formData, usnNumber: e.target.value })}
                placeholder="Enter USN number"
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
                onChange={(e) => setFormData({ ...formData, admissionNumber: e.target.value })}
                placeholder="Enter admission number"
                className="border-teal-300"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="section">SELECT SECTION</Label>
              <Select value={formData.section} onValueChange={(value) => setFormData({ ...formData, section: value })}>
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
                onValueChange={(value) => setFormData({ ...formData, modeOfTransport: value })}
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
                onChange={(e) => setFormData({ ...formData, parentCardNumber: e.target.value })}
                placeholder="Enter parent card number"
                className="border-teal-300"
              />
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <Button
            type="submit"
            className={`px-8 py-3 ${
              mode === "delete" ? "bg-red-500 hover:bg-red-600" : "bg-teal-500 hover:bg-teal-600"
            }`}
          >
            {mode === "add" ? "Add Student" : mode === "modify" ? "Update Student" : "Delete Student"}
          </Button>
        </div>
      </form>
    </div>
  )
}
