import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, writeBatch } from "firebase/firestore";
import * as fs from "fs";
import * as xlsx from "xlsx";

// 1. Initialize Firebase using the environment variables from your .env file
// Bun automatically loads .env files
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Path to your CSV file
const CSV_FILE_PATH = "./TNS_Student_DB.csv"; // UPDATE THIS if your CSV name is different

async function checkExtraStudents() {
  if (!fs.existsSync(CSV_FILE_PATH)) {
    console.error(`Error: Could not find ${CSV_FILE_PATH}. Please make sure the file is in this directory.`);
    process.exit(1);
  }

  // 2. Read the CSV file using the xlsx package (which you already have installed)
  const workbook = xlsx.readFile(CSV_FILE_PATH);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  // Convert CSV to JSON array
  const csvData = xlsx.utils.sheet_to_json(worksheet) as any[];

  // Extract USNs and their corresponding data from CSV
  // The column name is exactly "USN" based on your screenshot
  const csvUsns = new Set<string>();
  const csvDataMap = new Map<string, any>();

  csvData.forEach((row, index) => {
    // Sometimes column headers have spaces, we can trim keys just in case
    const usnKey = Object.keys(row).find(k => k.trim().toUpperCase() === "USN");
    if (usnKey && row[usnKey]) {
      // Normalize USN (trim spaces, uppercase)
      const normalizedUsn = String(row[usnKey]).trim().toUpperCase();
      csvUsns.add(normalizedUsn);
      csvDataMap.set(normalizedUsn, row);
    } else {
      console.warn(`Warning: Row ${index + 2} does not have a valid USN value.`);
    }
  });

  // 3. Fetch students from Firestore (Single Read operation)
  const studentsSnapshot = await getDocs(collection(db, "students"));
  const dbStudents = studentsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as any[];

  // 4. Compare and find grade mismatches
  console.log("\n===============================================");
  console.log("❌ GRADE MISMATCHES");
  console.log("===============================================");

  let gradeErrorCount = 0;
  for (const student of dbStudents) {
    // Check both usn and usnNumber fields just in case
    const rawUsn = student.usn || student.usnNumber || student.id;
    if (!rawUsn) continue;

    // Some IDs in your DB might have a suffix like _L01. 
    // Let's strip it to match the raw USN from CSV
    const normalizedDbUsn = String(rawUsn).replace(/_L01$/, "").trim().toUpperCase();

    if (csvUsns.has(normalizedDbUsn)) {
      // Check if grades match
      const csvStudent = csvDataMap.get(normalizedDbUsn);
      const gradeKey = Object.keys(csvStudent).find(k => k.trim().toUpperCase() === "GRADE");
      const csvGrade = gradeKey ? String(csvStudent[gradeKey]).trim() : "Unknown";
      
      const dbGrade = student.grade ? String(student.grade).trim() : "Unknown";

      if (csvGrade.toUpperCase() !== dbGrade.toUpperCase()) {
         console.log(`❌ Grade Mismatch -> Name: ${student.name} | USN: ${normalizedDbUsn} | DB Grade: ${dbGrade} | CSV Grade: ${csvGrade}`);
         gradeErrorCount++;
      }
    }
  }

  console.log(`\nTotal Grade Errors in Database: ${gradeErrorCount}\n`);

  // Exit cleanly
  process.exit(0);
}

export async function updateGradeMismatches() {
  if (!fs.existsSync(CSV_FILE_PATH)) {
    console.error(`Error: Could not find ${CSV_FILE_PATH}. Please make sure the file is in this directory.`);
    process.exit(1);
  }

  // Read the CSV file using the xlsx package
  const workbook = xlsx.readFile(CSV_FILE_PATH);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const csvData = xlsx.utils.sheet_to_json(worksheet) as any[];

  // Extract USNs and their corresponding data from CSV
  const csvUsns = new Set<string>();
  const csvDataMap = new Map<string, any>();

  csvData.forEach((row) => {
    const usnKey = Object.keys(row).find(k => k.trim().toUpperCase() === "USN");
    if (usnKey && row[usnKey]) {
      const normalizedUsn = String(row[usnKey]).trim().toUpperCase();
      csvUsns.add(normalizedUsn);
      csvDataMap.set(normalizedUsn, row);
    }
  });

  // Fetch students from Firestore
  const studentsSnapshot = await getDocs(collection(db, "students"));
  const dbStudents = studentsSnapshot.docs.map(docSnapshot => ({
    id: docSnapshot.id,
    ...docSnapshot.data()
  })) as any[];

  console.log("\n===============================================");
  console.log("🔄 UPDATING GRADE MISMATCHES");
  console.log("===============================================");

  let updatedCount = 0;
  let batch = writeBatch(db);
  let currentBatchSize = 0;
  let totalBatchesCommitted = 0;

  for (const student of dbStudents) {
    const rawUsn = student.usn || student.usnNumber || student.id;
    if (!rawUsn) continue;

    const normalizedDbUsn = String(rawUsn).replace(/_L01$/, "").trim().toUpperCase();

    if (csvUsns.has(normalizedDbUsn)) {
      const csvStudent = csvDataMap.get(normalizedDbUsn);
      const gradeKey = Object.keys(csvStudent).find(k => k.trim().toUpperCase() === "GRADE");
      const csvGrade = gradeKey ? String(csvStudent[gradeKey]).trim() : "Unknown";
      
      const dbGrade = student.grade ? String(student.grade).trim() : "Unknown";

      if (csvGrade.toUpperCase() !== dbGrade.toUpperCase() && csvGrade !== "Unknown") {
         console.log(`Queueing update for Name: ${student.name} | USN: ${normalizedDbUsn} | DB Grade: ${dbGrade} -> CSV Grade: ${csvGrade}`);
         
         const studentRef = doc(db, "students", student.id);
         batch.update(studentRef, { grade: csvGrade });
         
         updatedCount++;
         currentBatchSize++;

         // Firestore allows a maximum of 500 writes per batch
         if (currentBatchSize === 500) {
           console.log(`\nCommitting batch of 500 updates...`);
           await batch.commit();
           totalBatchesCommitted++;
           batch = writeBatch(db);
           currentBatchSize = 0;
         }
      }
    }
  }

  // Commit any remaining updates that didn't reach the 500 limit
  if (currentBatchSize > 0) {
    console.log(`\nCommitting final batch of ${currentBatchSize} updates...`);
    await batch.commit();
    totalBatchesCommitted++;
  }

  console.log(`\n===============================================`);
  console.log(`✅ Success! Total Grades Updated: ${updatedCount}`);
  console.log(`Total Batches Committed: ${totalBatchesCommitted}`);
  console.log(`===============================================\n`);

  process.exit(0);
}

// To check for mismatches without updating, uncomment the block below:
// checkExtraStudents().catch(err => {
//   console.error("An error occurred:", err);
//   process.exit(1);
// });

// To execute the updates in the database, run the script as is (calls updateGradeMismatches):
updateGradeMismatches().catch(err => {
  console.error("An error occurred:", err);
  process.exit(1);
});
