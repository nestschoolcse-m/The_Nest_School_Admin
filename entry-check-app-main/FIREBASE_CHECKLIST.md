# Firebase Implementation Checklist

## 🔧 Installation & Setup

### Step 1: Install Dependencies

```bash
npm install
```

- [ ] Completed without errors
- [ ] `firebase` package installed
- [ ] `firebase-admin` package installed

### Step 2: Configure Environment Variables

- [ ] Created `.env.local` file in project root
- [ ] Added `NEXT_PUBLIC_FIREBASE_API_KEY`
- [ ] Added `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- [ ] Added `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- [ ] Added `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- [ ] Added `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- [ ] Added `NEXT_PUBLIC_FIREBASE_APP_ID`
- [ ] `.env.local` is in `.gitignore` (don't commit credentials!)

## 🗄️ Firebase Setup

### Step 3: Create Firestore Collection

- [ ] Firebase project created/selected
- [ ] Firestore Database enabled
- [ ] Created collection named `students`
- [ ] Firestore location selected

### Step 4: Add Sample Data

- [ ] Added at least 1 test document
- [ ] Document ID set to USN (e.g., `NP25025_L01`)
- [ ] Added field: `name` (String)
- [ ] Added field: `dob` (String, format: DD/MM/YYYY)
- [ ] Added field: `grade` (String)
- [ ] Added field: `fatherName` (String)
- [ ] Added field: `fatherMobile` (Number)
- [ ] Added field: `motherName` (String)
- [ ] Added field: `motherMobile` (Number)
- [ ] Added field: `createdAt` (Timestamp)

### Step 5: Configure Security Rules

- [ ] Opened Firestore Rules editor
- [ ] Set read access to `true`
- [ ] Set write access to `false`
- [ ] Published rules

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

## 📁 Files Verification

### Core Files Created

- [ ] `lib/firebase-client.ts` exists
- [ ] `hooks/use-students.ts` exists
- [ ] `lib/firebase.ts` exists (for future use)

### Documentation Files

- [ ] `FIREBASE_SETUP.md` exists
- [ ] `FIRESTORE_SCHEMA.md` exists
- [ ] `FIREBASE_INTEGRATION_SUMMARY.md` exists
- [ ] `FIREBASE_COMPLETE.md` exists
- [ ] `.env.example` exists
- [ ] `.env.local.example` exists

### Updated Components

- [ ] `components/student-table.tsx` updated
- [ ] `package.json` has Firebase dependencies

## 🧪 Testing

### Test 1: Run Development Server

```bash
npm run dev
```

- [ ] Server starts without errors
- [ ] No Firebase initialization errors in console
- [ ] App loads at `http://localhost:3000`

### Test 2: Navigate to Students Page

- [ ] Go to `/students` page
- [ ] Page loads
- [ ] Student table appears
- [ ] Loading spinner shows briefly (if slow connection)

### Test 3: Verify Data Display

- [ ] Students from Firestore appear in table
- [ ] Student names display correctly
- [ ] USN numbers display
- [ ] Grades display
- [ ] Parent information displays
- [ ] No error messages in console

### Test 4: Test Search Functionality

- [ ] Click search box
- [ ] Type student name
- [ ] Results filter correctly
- [ ] Search works with partial matches

### Test 5: Add More Test Data

- [ ] Go to Firebase Console
- [ ] Add 2-3 more student documents
- [ ] Refresh app page
- [ ] New students appear automatically (real-time update)

## 🐛 Troubleshooting Checklist

If something isn't working:

### Firebase Connection Issues

- [ ] Check `.env.local` exists
- [ ] Verify all 6 Firebase variables are set
- [ ] Check Firebase variables in browser DevTools Console:
  ```javascript
  console.log(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
  ```
- [ ] Firebase Console is accessible and project exists

### Data Not Showing

- [ ] Open Firestore Console
- [ ] Confirm `students` collection exists
- [ ] Confirm documents exist in collection
- [ ] Check document field names (case-sensitive):
  - [ ] `name` (not `Name`)
  - [ ] `fatherName` (not `fathername`)
  - [ ] `fatherMobile` (not `fathermobile`)
- [ ] Check data types:
  - [ ] `fatherMobile` is **Number**, not String
  - [ ] `dob` is **String** (format: "DD/MM/YYYY")
  - [ ] `createdAt` is **Timestamp**

### Performance Issues

- [ ] Too many students loading slowly?
  - [ ] Add Firestore indexes
  - [ ] Implement pagination
  - [ ] Add query filters

### Console Errors

- [ ] Check browser DevTools Console (F12)
- [ ] Take note of any Firebase error messages
- [ ] Search for error in FIREBASE_SETUP.md troubleshooting

## 📋 Post-Setup Tasks

### Update Other Components

- [ ] Find all uses of `import { students } from "@/lib/data"`
- [ ] Replace with `useStudents()` hook
- [ ] Update component to handle loading/error states
- [ ] Test each component

### Code Cleanup

- [ ] Remove or archive old `lib/data.ts` if no longer needed
- [ ] Update any other files importing from old data
- [ ] Run TypeScript check: `npx tsc --noEmit`

### Optimization

- [ ] Add Firestore indexes for frequently used queries
- [ ] Consider implementing pagination for large datasets
- [ ] Add caching if needed
- [ ] Monitor Firestore usage in console

## 📚 Documentation Review

- [ ] Read through FIREBASE_SETUP.md
- [ ] Review FIRESTORE_SCHEMA.md for data structure
- [ ] Understand the React hooks in use-students.ts
- [ ] Know where to find troubleshooting guides

## ✅ Final Verification

### Before Deployment

- [ ] All tests passing
- [ ] No console errors
- [ ] Real data showing in app
- [ ] Search functionality working
- [ ] Firestore rules are secure
- [ ] Environment variables are NOT in git
- [ ] `.gitignore` includes `.env.local`

### Deployment Checklist

- [ ] Production Firebase project ready
- [ ] Production Firestore configured
- [ ] Security rules reviewed and updated
- [ ] Environment variables set in deployment platform
- [ ] Database backed up
- [ ] Team informed of new data source

## 🎉 Success Indicators

✅ **You're done when:**

- Firebase library loads without errors
- Students appear on Students page
- Real-time updates work (add data in Firestore, see it update)
- Search functionality works
- No errors in browser console
- All components updated

---

## 💡 Quick Command Reference

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Check for TypeScript errors
npx tsc --noEmit

# Build for production
npm run build

# Search for old data imports
grep -r "from \"@/lib/data\"" components/
```

## 📞 Support Resources

1. **FIREBASE_SETUP.md** - Detailed setup guide
2. **FIRESTORE_SCHEMA.md** - Database structure
3. **FIREBASE_INTEGRATION_SUMMARY.md** - Quick reference
4. **use-students.ts** - React hooks documentation
5. [Firebase Documentation](https://firebase.google.com/docs)

---

**Track your progress:** Check off each item as you complete it!

Last updated: January 16, 2026
