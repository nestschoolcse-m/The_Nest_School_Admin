# Firebase Firestore Document Structure Guide

## Collection: `students`

Each document in the `students` collection should follow this structure:

### Document ID (Key)

The document ID should be the USN (Unique Student Number), for example: `NP25025_L01`

### Document Fields

| Field Name     | Type      | Example                        | Notes                                   |
| -------------- | --------- | ------------------------------ | --------------------------------------- |
| `name`         | String    | `"JAI LAKSH"`                  | Student's full name                     |
| `dob`          | String    | `"14/07/2010"`                 | Date of birth in DD/MM/YYYY format      |
| `grade`        | String    | `"Gr 10"`                      | Grade level (e.g., Gr 10, PRE-KG, etc.) |
| `fatherName`   | String    | `"Saravanan Ramaiah"`          | Father's full name                      |
| `fatherMobile` | Number    | `7305544412`                   | Father's mobile number (10 digits)      |
| `motherName`   | String    | `"Suganthi Saravanan Ramaiah"` | Mother's full name                      |
| `motherMobile` | Number    | `8148222455`                   | Mother's mobile number (10 digits)      |
| `createdAt`    | Timestamp | `2026-01-14T11:35:28Z`         | Date/time when record was created       |

## Example Document (JSON)

```json
{
  "name": "JAI LAKSH",
  "dob": "14/07/2010",
  "grade": "Gr 10",
  "fatherName": "Saravanan Ramaiah",
  "fatherMobile": 7305544412,
  "motherName": "Suganthi Saravanan Ramaiah",
  "motherMobile": 8148222455,
  "createdAt": {
    "_seconds": 1673774128,
    "_nanoseconds": 0
  }
}
```

## How to Add Data to Firestore

### Method 1: Firebase Console (Manual)

1. Open [Firebase Console](https://console.firebase.google.com/)
2. Navigate to your project
3. Go to **Firestore Database**
4. Click **Create collection** → Name it `students`
5. Click **Add document**
6. Set **Document ID** to the USN (e.g., `NP25025_L01`)
7. Add fields:
   - `name` (String)
   - `dob` (String)
   - `grade` (String)
   - `fatherName` (String)
   - `fatherMobile` (Number)
   - `motherName` (String)
   - `motherMobile` (Number)
   - `createdAt` (Timestamp)

### Method 2: Firebase Admin SDK (Bulk Import)

```javascript
const admin = require("firebase-admin");
const serviceAccount = require("./path/to/serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const studentsData = [
  {
    usn: "NP25025_L01",
    name: "JAI LAKSH",
    dob: "14/07/2010",
    grade: "Gr 10",
    fatherName: "Saravanan Ramaiah",
    fatherMobile: 7305544412,
    motherName: "Suganthi Saravanan Ramaiah",
    motherMobile: 8148222455,
    createdAt: new Date(),
  },
  // Add more students...
];

async function importStudents() {
  for (const student of studentsData) {
    const { usn, ...data } = student;
    await db.collection("students").doc(usn).set(data);
  }
  console.log("Students imported successfully!");
}

importStudents();
```

## Field Type Requirements

- **name, dob, grade, fatherName, motherName**: Must be **String** type
- **fatherMobile, motherMobile**: Must be **Number** type (not string!)
- **createdAt**: Must be **Timestamp** type
- **Document ID (USN)**: String format

## Important Notes

⚠️ **Case Sensitivity**: Field names are case-sensitive. Use exact names:

- ✅ `fatherMobile` (correct)
- ❌ `FatherMobile` (wrong)
- ❌ `fathermobile` (wrong)

📝 **Date Format**: Always use `DD/MM/YYYY` for the `dob` field:

- ✅ `"14/07/2010"`
- ❌ `"2010-07-14"`
- ❌ `"14-07-2010"`

📱 **Mobile Numbers**: Store as numbers, not strings:

- ✅ `7305544412` (Number type)
- ❌ `"7305544412"` (String type)

🏷️ **Grade Format**: Maintain consistent format:

- ✅ `"Gr 10"` or `"PRE-KG"` or `"CLASS 5"`
- Be consistent across all records

## Sample Data for Testing

Copy and paste this into Firestore manually or use the import script above:

```json
[
  {
    "usn": "NP25025_L01",
    "name": "JAI LAKSH",
    "dob": "14/07/2010",
    "grade": "Gr 10",
    "fatherName": "Saravanan Ramaiah",
    "fatherMobile": 7305544412,
    "motherName": "Suganthi Saravanan Ramaiah",
    "motherMobile": 8148222455,
    "createdAt": "2026-01-14T11:35:28Z"
  },
  {
    "usn": "NP25026_L01",
    "name": "Roxanne R",
    "dob": "23/09/2022",
    "grade": "PRE-KG",
    "fatherName": "Robert Johnson",
    "fatherMobile": 9876543210,
    "motherName": "Emma Johnson",
    "motherMobile": 8765432109,
    "createdAt": "2026-01-10T15:20:10Z"
  },
  {
    "usn": "NP25006_L01",
    "name": "Mitakshi A",
    "dob": "30/07/2022",
    "grade": "PRE-KG",
    "fatherName": "Anil Sharma",
    "fatherMobile": 9988776655,
    "motherName": "Priya Sharma",
    "motherMobile": 8877665544,
    "createdAt": "2026-01-12T09:45:30Z"
  }
]
```

## Firestore Security Rules (Read-Only)

Add this to your Firestore Security Rules if your app only reads data:

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

## Verifying Your Data

After adding documents, verify in the app:

1. Make sure `.env.local` is properly configured
2. Run `npm run dev`
3. Navigate to the Students page
4. You should see your data displayed in the student table

## Troubleshooting

**Data not appearing?**

- Check field names match exactly (case-sensitive)
- Verify Document ID format matches your USN format
- Ensure Firestore rules allow read access
- Check browser console for error messages

**Wrong data type?**

- Use Firebase Console's type selector when creating fields
- Mobile numbers must be "Number" type, not "String"

**Can't find collection?**

- Create the `students` collection first
- Collections are created automatically when you add the first document

---

Need help? See [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) for complete setup instructions.
