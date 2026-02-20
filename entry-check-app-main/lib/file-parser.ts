/**
 * File Parser Utilities for Bulk Student Upload
 * Supports CSV and XLSX formats
 */

export interface ParsedStudent {
  name: string | null;
  grade: string | null;
  section: string | null;
  admissionNumber: string | null;
  usn: string | null;
  dob: string | null;
  fatherName: string | null;
  motherName: string | null;
  fatherMobile: string | null;
  motherMobile: string | null;
  gender: string | null;
}

export interface ParsedFileData {
  grades: string[];
  students: { [grade: string]: ParsedStudent[] };
  errors: string[];
}

/**
 * Parse CSV file content
 */
export async function parseCSV(file: File): Promise<ParsedFileData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const csv = event.target?.result as string;
        const lines = csv
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line);

        if (lines.length === 0) {
          resolve({ grades: [], students: {}, errors: ["CSV file is empty"] });
          return;
        }

        // Parse CSV
        const students: ParsedStudent[] = [];
        const gradeMap: { [grade: string]: ParsedStudent[] } = {};

        for (let i = 1; i < lines.length; i++) {
          const parts = lines[i].split(",").map((p) => p.trim());
          if (parts.length < 4) continue;

          const name = parts[1] || null;
          const gradeInfo = parseGradeSection(parts[2] || null);
          const usn = parts[3] || null;

          if (!name && !usn) continue;

          const student: ParsedStudent = {
            name,
            grade: gradeInfo.grade,
            section: parts[9] && parts[9] !== "nil" ? parts[9] : gradeInfo.section,
            admissionNumber: parts[0] || null, // Assuming 1st column is Admission No in CSV
            usn,
            dob: parts[4] || null,
            fatherName: parts[5] || null,
            motherName: parts[6] || null,
            fatherMobile: parts[7] || null,
            motherMobile: parts[8] || null,
            gender: parts[10] || "Male",
          };

          students.push(student);
          if (gradeInfo.grade) {
            if (!gradeMap[gradeInfo.grade]) gradeMap[gradeInfo.grade] = [];
            gradeMap[gradeInfo.grade].push(student);
          }
        }

        const grades = Object.keys(gradeMap).sort();
        resolve({ grades, students: gradeMap, errors: [] });
      } catch (error) {
        resolve({
          grades: [],
          students: {},
          errors: [
            `Error parsing CSV: ${error instanceof Error ? error.message : "Unknown error"}`,
          ],
        });
      }
    };

    reader.readAsText(file);
  });
}

/**
 * Parse XLSX file content
 */
export async function parseXLSX(file: File): Promise<ParsedFileData> {
  try {
    const XLSX = await import("xlsx");
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });


    const gradeMap: { [grade: string]: ParsedStudent[] } = {};
    const allErrors: string[] = [];

    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      const rawData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
      }) as any[];

      if (!rawData || rawData.length === 0) {
        continue;
      }


      // Find header row (should be row 4, which is index 3)
      const headerResult = findXLSXHeaders(rawData);
      if (headerResult.headerIndex === -1) {
        allErrors.push(`Could not find header row in sheet ${sheetName}`);
        continue;
      }


      // Map columns
      const columnMap = mapXLSXColumns(headerResult.headers);

      // CRITICAL FIX: Determine data start row based on header position
      // There are TWO structures in the Excel file:
      // Structure 1 (LKG sheets): Headers at row 2 (index 1), instructions at row 3, data starts at row 4 or 5
      // Structure 2 (most sheets): Headers at row 4 (index 3), instructions at row 5, data starts at row 6 (index 5)
      let startRow: number;
      if (headerResult.headerIndex === 1) {
        // Headers at row 2 - this is LKG structure
        // Check if row 4 (index 3) is empty, if so start from row 5
        const row4 = rawData[3];
        const isEmpty = !row4 || row4.every((cell: any) => !cell || String(cell).trim() === "");
        startRow = isEmpty ? 4 : 3; // row 5 or row 4 (0-indexed)
      } else {
        // Headers at row 4 or later - use standard structure
        startRow = 5; // row 6 (0-indexed)
      }
      
      let rowsProcessed = 0;
      let rowsSkipped = 0;


      for (let i = startRow; i < rawData.length; i++) {
        const row = rawData[i];

        if (!row || row.length === 0) {
          rowsSkipped++;
          continue;
        }

        // Skip empty rows or rows that look like instructions
        const rowContent = row
          .map((v: any) =>
            String(v || "")
              .toLowerCase()
              .trim(),
          )
          .join(" ");

        const isInstructionRow =
          rowContent.includes("select") ||
          rowContent.includes("list entire") ||
          rowContent.includes("type") ||
          rowContent.includes("indicate in detail") ||
          rowContent.includes("enter grade") ||
          rowContent.includes("email id") ||
          rowContent.includes("(note") ||
          rowContent.includes("format");

        if (isInstructionRow) {
          rowsSkipped++;
          continue;
        }

        const student = extractStudentFromXLSXRow(row, columnMap);

        // Accept if we have USN or valid name (at least 2 chars)
        if (student.usn || (student.name && student.name.length >= 2)) {
          // IMPORTANT: Use sheet name to determine grade (preserves sections like "GR 1 A", "LKG B")
          // The grade column in data often doesn't have section letters
          const sheetGradeInfo = parseGradeSection(sheetName);
          const gradeFromSheet = sheetGradeInfo.grade;
          
          // Only add if grade is valid (not null after normalization)
          if (!gradeFromSheet) {
            rowsSkipped++;
            continue;
          }
          
          // Override the student's grade and section with sheet-based info if needed
          student.grade = gradeFromSheet;
          if (student.section === "nil" || !student.section) {
            student.section = sheetGradeInfo.section;
          }

          if (!gradeMap[gradeFromSheet]) {
            gradeMap[gradeFromSheet] = [];
          }
          gradeMap[gradeFromSheet].push(student);

          if (rowsProcessed < 5) {
          }
          rowsProcessed++;
        } else {
          if (rowsProcessed < 5) {
            const firstName = row[columnMap["name"]] || "N/A";
          }
          rowsSkipped++;
        }
      }

    }

    const grades = Object.keys(gradeMap).sort((a, b) => {
      // Custom sort: PREKG, LKG, UKG, G1-G10
      const order = ["PREKG", "LKG", "UKG"];
      const aIndex = order.indexOf(a);
      const bIndex = order.indexOf(b);

      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;

      // For numbered grades (G1, G1 A, G2, etc), sort numerically
      const aNum = parseInt(a.match(/\d+/)?.[0] || "999", 10);
      const bNum = parseInt(b.match(/\d+/)?.[0] || "999", 10);

      if (aNum !== bNum) return aNum - bNum;

      // If same number, sort sections alphabetically (G1 before G1 A)
      return a.localeCompare(b);
    });

    return { grades, students: gradeMap, errors: allErrors };
  } catch (error) {
    return {
      grades: [],
      students: {},
      errors: [
        `Error parsing XLSX: ${error instanceof Error ? error.message : "Unknown error"}`,
      ],
    };
  }
}

/**
 * Find header row in XLSX data
 */
function findXLSXHeaders(data: any[]): {
  headerIndex: number;
  headers: string[];
} {

  const commonHeaders = [
    "name",
    "student",
    "grade",
    "usn",
    "dob",
    "date",
    "father",
    "mother",
    "mobile",
    "contact",
  ];

  let bestScore = 0;
  let bestIndex = -1;
  let bestHeaders: string[] = [];

  for (let i = 0; i < Math.min(20, data.length); i++) {
    const row = data[i];
    if (!row || row.length < 3) continue;

    const lowerValues: string[] = row
      .map((v: any) =>
        String(v || "")
          .toLowerCase()
          .trim(),
      )
      .filter((v: string): v is string => v !== null && v !== undefined);

    const hasNonEmptyCells = lowerValues.filter(
      (v: string) => v.length > 0,
    ).length;

    if (hasNonEmptyCells < 3) continue;

    // Score based on matching common header words
    let score = 0;
    for (const header of lowerValues) {
      if (!header) continue; // Skip empty strings
      for (const common of commonHeaders) {
        if (header.includes(common)) score++;
      }
    }

    // Bonus for having USN or Grade
    if (lowerValues.some((h: string) => h.includes("usn"))) score += 3;
    if (lowerValues.some((h: string) => h.includes("grade"))) score += 3;


    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
      bestHeaders = lowerValues;
    }
  }

  if (bestIndex === -1) {
    return { headerIndex: -1, headers: [] };
  }

  return { headerIndex: bestIndex, headers: bestHeaders };
}

/**
 * Map column headers to student fields
 */
function mapXLSXColumns(headers: string[]): {
  [field: string]: number;
} {
  const mapping: { [field: string]: number } = {};

  const fieldAliases: { [field: string]: string[] } = {
    name: ["name", "student", "student name", "name of student", "full name"],
    grade: ["grade", "class", "standard", "gr", "g"],
    section: ["section", "sec", "div", "division"],
    usn: ["usn", "usn number", "enrollment", "id", "student id"],
    dob: ["dob", "date of birth", "birth", "birthday", "born"],
    fatherName: ["father", "father name", "father's name"],
    motherName: ["mother", "mother name", "mother's name"],
    fatherMobile: [
      "father mobile",
      "father phone",
      "father no",
      "father contact",
    ],
    motherMobile: [
      "mother mobile",
      "mother phone",
      "mother no",
      "mother contact",
    ],
    admissionNumber: ["admission number", "adm no", "admission no", "reg no", "admission"],
    gender: ["gender", "sex", "m/f"],
  };

  for (const [field, aliases] of Object.entries(fieldAliases)) {
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i];
      if (!header) continue; // Skip empty headers
      for (const alias of aliases) {
        if (header.includes(alias)) {
          mapping[field] = i;
          break;
        }
      }
      if (mapping[field] !== undefined) break;
    }
  }

  return mapping;
}

/**
 * Convert Excel serial date or string date to DD/MM/YYYY format
 * Excel stores dates as serial numbers (days since 1900-01-01)
 * @param value - Either a number (Excel serial) or date string
 * @returns Formatted date string in DD/MM/YYYY format or original string if not a date
 */
function formatDOB(value: any): string | null {
  if (!value) return null;

  // If it's a number, treat it as Excel serial date
  if (typeof value === "number") {
    // Excel's serial date system starts from January 1, 1900
    // But Excel has a bug where it treats 1900 as a leap year
    // So we need to account for dates after Feb 28, 1900
    const excelEpoch = new Date(1900, 0, 1);
    const date = new Date(
      excelEpoch.getTime() + (value - 1) * 24 * 60 * 60 * 1000,
    );

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  }

  // If it's a string, check if it's already in correct format or needs conversion
  const str = String(value).trim();

  // Check if already in DD/MM/YYYY format
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
    return str;
  }

  // Check if in YYYY-MM-DD format (ISO)
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const parts = str.split("-");
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  // Try to parse as date and convert
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const day = String(parsed.getDate()).padStart(2, "0");
    const month = String(parsed.getMonth() + 1).padStart(2, "0");
    const year = parsed.getFullYear();
    return `${day}/${month}/${year}`;
  }

  // Return original string if can't parse
  return str.length > 0 ? str : null;
}

/**
 * Extract student data from XLSX row
 */
function extractStudentFromXLSXRow(
  row: any[],
  columnMap: { [field: string]: number },
): ParsedStudent {
  const getValue = (field: string): string | null => {
    const idx = columnMap[field];
    if (idx === undefined || idx < 0 || idx >= row.length) return null;
    const val = row[idx];
    if (!val) return null;
    const trimmed = String(val).trim();
    return trimmed.length > 0 ? trimmed : null;
  };

  const name = getValue("name");
  const gradeRaw = getValue("grade");
  const section = getValue("section");
  const admissionNumber = getValue("admissionNumber");
  const usn = getValue("usn");
  const dob = formatDOB(row[columnMap["dob"]]); // Use formatDOB for date conversion
  const fatherName = getValue("fatherName");
  const motherName = getValue("motherName");
  const fatherMobile = getValue("fatherMobile");
  const motherMobile = getValue("motherMobile");
  const gender = getValue("gender");

  const gradeInfo = parseGradeSection(gradeRaw);
  const finalSection = section && section !== "nil" ? section : gradeInfo.section;

  return {
    name,
    grade: gradeInfo.grade,
    section: finalSection,
    admissionNumber,
    usn,
    dob,
    fatherName,
    motherName,
    fatherMobile,
    motherMobile,
    gender: gender || "Male",
  };
}

/**
 * Normalize grade format
 * Accepts: PREKG, LKG, UKG, GR 1-10 (with optional sections A, B, C, etc)
 * Converts: "GR 1 A", "Grade 9", "UKG A", "PRE KG B" -> "PREKG A", "LKG B", "UKG C", "G1", "G1 A", "G9", etc
 * PRESERVES SECTION LETTERS
 */
/**
 * Normalizes a grade string to a standard format (PREKG, LKG, UKG, G1-G10)
 * Also handles Roman numerals (I-X)
 * Returns the grade part only.
 */
export function normalizeGrade(grade: string | null): string | null {
  if (!grade) return null;

  let str = String(grade).trim().toUpperCase();
  
  // Remove common prefixes
  str = str.replace(/^(GRADE|GR|CLASS|STANDARD|SEC|SECTION)\s+/i, "").trim();

  // Handle Pre-Primary
  if (str.includes("PREKG") || str.includes("PRE-KG") || (str.includes("PRE") && str.includes("KG"))) return "PREKG";
  if (str.includes("LKG") || str.includes("L.K.G")) return "LKG";
  if (str.includes("UKG") || str.includes("U.K.G")) return "UKG";

  // Handle Roman Numerals (I to X)
  const romanMap: { [key: string]: string } = {
    I: "G1", II: "G2", III: "G3", IV: "G4", V: "G5",
    VI: "G6", VII: "G7", VIII: "G8", IX: "G9", X: "G10"
  };

  // Check for Roman numerals at the start (even without space, like "IVA")
  const romanMatch = str.match(/^(X|IX|VIII|VII|VI|V|IV|III|II|I)/);
  if (romanMatch) {
    // Check if the rest is just section or empty
    const remaining = str.substring(romanMatch[0].length).trim();
    if (remaining === "" || /^[A-Z]$/.test(remaining) || /^[\s-][A-Z]$/.test(remaining)) {
      return romanMap[romanMatch[1]];
    }
  }

  // Handle G1, G2, etc.
  const gMatch = str.match(/^G(\d+)/i);
  if (gMatch) {
    const num = parseInt(gMatch[1], 10);
    if (num >= 1 && num <= 10) return `G${num}`;
  }

  // Handle plain numbers (1, 2, 3...)
  const numMatch = str.match(/^(\d+)/);
  if (numMatch) {
    const num = parseInt(numMatch[1], 10);
    if (num >= 1 && num <= 10) return `G${num}`;
  }

  return null;
}

/**
 * Parses a string that might contain both grade and section
 * Example: "IV A" -> { grade: "G4", section: "A" }
 * Example: "IVA" -> { grade: "G4", section: "A" }
 * Example: "4B" -> { grade: "G4", section: "B" }
 */
export function parseGradeSection(gradeStr: string | null): { grade: string, section: string } {
  if (!gradeStr) return { grade: "PREKG", section: "nil" };

  const fullStr = String(gradeStr).trim().toUpperCase();
  const normalizedGrade = normalizeGrade(fullStr);
  
  if (!normalizedGrade) return { grade: "PREKG", section: "nil" };

  // Determine section by looking at what's left after removing the grade part
  // We need to be careful with Roman numerals vs G-numbers
  
  let section = "";
  
  // Try to extract section from the end
  const sectionMatch = fullStr.match(/[\s-]?([A-Z])$/);
  if (sectionMatch) {
    const potentialSection = sectionMatch[1];
    
    // Check if this potential section is not part of the grade itself (like the 'G' in PG?)
    // But since we already normalized, we can check if fullStr without this last part still normalizes to the same thing
    const basePart = fullStr.substring(0, fullStr.lastIndexOf(potentialSection)).trim();
    if (normalizeGrade(basePart) === normalizedGrade || basePart === "") {
      section = potentialSection;
    }
  }

  return {
    grade: normalizedGrade,
    section: section || "nil"
  };
}