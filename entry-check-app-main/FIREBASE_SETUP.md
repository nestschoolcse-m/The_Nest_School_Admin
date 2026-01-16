# Firebase Integration Guide

## Overview

This application now uses Firebase Firestore to fetch student data in real-time instead of using static data from `lib/data.ts`.

## Setup Instructions

### 1. Firebase Project Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Navigate to **Project Settings** (bottom left)
4. Copy your Firebase configuration values

### 2. Environment Variables

Create a `.env.local` file in the root directory (`entry-check-app-main/`) with your Firebase configuration:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id_here
```

> **Note:** These variables must start with `NEXT_PUBLIC_` to be accessible in the browser.

### 3. Firestore Database Structure

Create a Firestore collection named `students` with documents where:

- **Document ID** = USN (e.g., `NP25025_L01`)
- **Document fields:**

```json
{
  "name": "JAI LAKSH",
  "dob": "14/07/2010",
  "grade": "Gr 10",
  "fatherName": "Saravanan Ramaiah",
  "fatherMobile": 7305544412,
  "motherName": "Suganthi Saravanan Ramaiah",
  "motherMobile": 8148222455,
  "createdAt": "2026-01-14T11:35:28Z"
}
```

### 4. Firestore Security Rules

Set appropriate security rules for your Firestore database. Example (read-only for public):

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /students/{document=**} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

## Files Created

### 1. **`lib/firebase-client.ts`**

Client-side Firebase initialization for browser-based operations.

```typescript
import { db } from "@/lib/firebase-client";
// Use `db` in client components
```

### 2. **`hooks/use-students.ts`**

React hooks for fetching student data with loading and error states.

Available hooks:

- `useStudents()` - Fetch all students
- `useStudentsByGrade(grade)` - Fetch students by grade
- `useStudentsWithFilters(filters)` - Fetch with custom filters

Example usage:

```typescript
"use client";
import { useStudents } from "@/hooks/use-students";

export function MyComponent() {
  const { students, loading, error } = useStudents();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {students.map((s) => (
        <p>{s.name}</p>
      ))}
    </div>
  );
}
```

### 3. **`lib/firebase.ts`** (Optional - Server-side)

For server-side operations if needed in the future (requires Firebase Admin SDK).

## Updated Components

### **`components/student-table.tsx`**

Updated to use the `useStudents()` hook instead of static data. Now features:

- Real-time student data from Firebase
- Loading state indicator
- Error handling
- Search functionality with Firebase data

## Usage Examples

### Fetch All Students

```typescript
const { students, loading, error } = useStudents();
```

### Fetch Students by Grade

```typescript
const { students, loading, error } = useStudentsByGrade("Gr 10");
```

### Fetch with Filters

```typescript
const { students, loading, error } = useStudentsWithFilters({
  grade: "Gr 10",
  name: "JAI",
});
```

## Student Data Interface

```typescript
interface Student {
  id: string; // Same as USN
  usn: string; // Firestore document ID
  usnNumber: string; // Same as USN
  name: string;
  dob: string; // Format: "14/07/2010"
  grade: string; // Format: "Gr 10"
  fatherName: string;
  fatherMobile: number;
  motherName: string;
  motherMobile: number;
  createdAt: Timestamp | null;
}
```

## Troubleshooting

### "Firebase initialization error"

- Verify your environment variables are correct
- Check that your `.env.local` file exists and is properly formatted

### "Error fetching students"

- Ensure Firestore database is enabled in your Firebase project
- Check Firestore security rules allow read access
- Verify the `students` collection exists in Firestore

### Students not appearing

- Check Firestore console to ensure documents exist in the `students` collection
- Verify field names match exactly (case-sensitive)
- Check browser console for specific error messages

## Installing Dependencies

The required Firebase packages are:

```bash
npm install firebase firebase-admin
```

These are already listed as dependencies if you have them installed.

## Next Steps

1. Update other components that use `lib/data.ts` to use the Firebase hooks
2. Add real-time listeners for live updates if needed
3. Implement user authentication if required
4. Add Firestore query optimization for better performance
