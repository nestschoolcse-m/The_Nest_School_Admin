/**
 * File Parser Utilities for Bulk Student Upload
 * Supports CSV and XLSX formats
 * Strict schema: Sno, NAME, USN, GRADE, SEGMENT
 */

export interface ParsedStudent {
  name: string | null;
  grade: string | null;
  usn: string | null;
  segment: string | null;
}

export interface ParsedFileData {
  grades: string[];
  students: { [grade: string]: ParsedStudent[] };
  errors: string[];
}

export const calculateSegment = (grade: string | null): string => {
  if (!grade) return "Unknown";
  const g = grade.toUpperCase();
  if (["PREKG", "LKG", "UKG"].includes(g)) return "EYP";
  if (["G1", "G2", "G3", "G4", "G5"].includes(g)) return "PYP";
  if (["G6", "G7", "G8"].includes(g)) return "CIE LS";
  if (["G9", "G10"].includes(g)) return "CIE US";
  if (["G11", "G12", "AS LEVEL", "A LEVEL"].includes(g)) return "CIE SS";
  return "Unknown";
};

export function normalizeGrade(grade: string | null): string | null {
  if (!grade) return null;
  let str = String(grade).trim().toUpperCase();
  str = str.replace(/^(GRADE|GR|CLASS|STANDARD|SEC|SECTION)\s*/i, "").trim();

  if (str.includes("PREKG") || str.includes("PRE-KG") || (str.includes("PRE") && str.includes("KG"))) return "PREKG";
  if (str.includes("LKG") || str.includes("L.K.G")) return "LKG";
  if (str.includes("UKG") || str.includes("U.K.G")) return "UKG";

  if (str.includes("AS LEVEL") || str === "AS") return "AS LEVEL";
  if (str.includes("A LEVEL") || str.includes("A2 LEVEL") || str === "A2" || str === "A") return "A LEVEL";

  const romanMap: { [key: string]: string } = {
    I: "G1", II: "G2", III: "G3", IV: "G4", V: "G5",
    VI: "G6", VII: "G7", VIII: "G8", IX: "G9", X: "G10",
    XI: "G11", XII: "G12"
  };

  const romanMatch = str.match(/^(XII|XI|X|IX|VIII|VII|VI|V|IV|III|II|I)/);
  if (romanMatch) {
    const remaining = str.substring(romanMatch[0].length).trim();
    if (remaining === "" || /^[A-Z]$/.test(remaining) || /^[\s-][A-Z]$/.test(remaining)) {
      return romanMap[romanMatch[1]];
    }
  }

  const gMatch = str.match(/^G\s*(\d+)/i);
  if (gMatch) {
    const num = parseInt(gMatch[1], 10);
    if (num >= 1 && num <= 12) return `G${num}`;
  }

  const numMatch = str.match(/^(\d+)/);
  if (numMatch) {
    const num = parseInt(numMatch[1], 10);
    if (num >= 1 && num <= 12) return `G${num}`;
  }

  return null;
}

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

        const students: ParsedStudent[] = [];
        const gradeMap: { [grade: string]: ParsedStudent[] } = {};
        const errors: string[] = [];

        // Try to find the header row
        let headerIndex = -1;
        let columnMap = { name: -1, usn: -1, grade: -1, segment: -1 };
        
        for (let i = 0; i < Math.min(10, lines.length); i++) {
          const parts = lines[i].split(",").map((p) => p.trim().toLowerCase());
          const nameIdx = parts.findIndex(p => p.includes("name"));
          const usnIdx = parts.findIndex(p => p.includes("usn"));
          const gradeIdx = parts.findIndex(p => p.includes("grade") || p.includes("class"));
          
          if (nameIdx !== -1 && usnIdx !== -1 && gradeIdx !== -1) {
            headerIndex = i;
            columnMap = {
              name: nameIdx,
              usn: usnIdx,
              grade: gradeIdx,
              segment: parts.findIndex(p => p.includes("segment"))
            };
            break;
          }
        }

        const startRow = headerIndex !== -1 ? headerIndex + 1 : 1;
        
        // If no strict header found, assume: Sno(0), NAME(1), USN(2), GRADE(3), SEGMENT(4) based on prompt
        if (headerIndex === -1) {
          columnMap = { name: 1, usn: 2, grade: 3, segment: 4 };
        }

        for (let i = startRow; i < lines.length; i++) {
          const parts = lines[i].split(",").map((p) => p.trim());
          if (parts.length < 3) continue;

          const name = columnMap.name !== -1 ? parts[columnMap.name] : parts[1];
          const rawGrade = columnMap.grade !== -1 ? parts[columnMap.grade] : parts[3];
          const usn = columnMap.usn !== -1 ? parts[columnMap.usn] : parts[2];
          const segment = columnMap.segment !== -1 && parts[columnMap.segment] ? parts[columnMap.segment] : calculateSegment(normalizeGrade(rawGrade));

          if (!name && !usn) continue;

          const normalizedGrade = normalizeGrade(rawGrade);
          if (!normalizedGrade) {
            errors.push(`Row ${i + 1}: Could not normalize grade "${rawGrade}"`);
            continue;
          }

          const student: ParsedStudent = {
            name: name || null,
            grade: normalizedGrade,
            usn: usn || null,
            segment: segment,
          };

          students.push(student);
          if (!gradeMap[normalizedGrade]) gradeMap[normalizedGrade] = [];
          gradeMap[normalizedGrade].push(student);
        }

        const grades = Object.keys(gradeMap).sort();
        resolve({ grades, students: gradeMap, errors });
      } catch (error) {
        resolve({
          grades: [],
          students: {},
          errors: [`Error parsing CSV: ${error instanceof Error ? error.message : "Unknown error"}`],
        });
      }
    };

    reader.readAsText(file);
  });
}

export async function parseXLSX(file: File): Promise<ParsedFileData> {
  try {
    const XLSX = await import("xlsx");
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });

    const gradeMap: { [grade: string]: ParsedStudent[] } = {};
    const allErrors: string[] = [];

    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[];

      if (!rawData || rawData.length === 0) continue;

      // Find headers
      let headerIndex = -1;
      let columnMap = { name: -1, usn: -1, grade: -1, segment: -1 };
      
      for (let i = 0; i < Math.min(10, rawData.length); i++) {
        const row = rawData[i] || [];
        const lowerRow = row.map((v: any) => String(v || "").toLowerCase().trim());
        
        const nameIdx = lowerRow.findIndex((v: string) => v.includes("name"));
        const usnIdx = lowerRow.findIndex((v: string) => v.includes("usn"));
        const gradeIdx = lowerRow.findIndex((v: string) => v.includes("grade") || v.includes("class"));
        
        if (nameIdx !== -1 && (usnIdx !== -1 || gradeIdx !== -1)) {
          headerIndex = i;
          columnMap = {
            name: nameIdx,
            usn: usnIdx,
            grade: gradeIdx,
            segment: lowerRow.findIndex((v: string) => v.includes("segment"))
          };
          break;
        }
      }

      if (headerIndex === -1) {
        // Assume default format if headers missing
        columnMap = { name: 1, usn: 2, grade: 3, segment: 4 };
        headerIndex = 0;
      }

      const startRow = headerIndex + 1;

      for (let i = startRow; i < rawData.length; i++) {
        const row = rawData[i];
        if (!row || row.length === 0) continue;

        const name = columnMap.name !== -1 ? String(row[columnMap.name] || "").trim() : "";
        const rawGrade = columnMap.grade !== -1 ? String(row[columnMap.grade] || "").trim() : "";
        const usn = columnMap.usn !== -1 ? String(row[columnMap.usn] || "").trim() : "";
        
        let segment = columnMap.segment !== -1 ? String(row[columnMap.segment] || "").trim() : "";
        
        if (!name && !usn) continue;

        const normalizedGrade = normalizeGrade(rawGrade);
        if (!segment) {
          segment = calculateSegment(normalizedGrade);
        }

        if (!normalizedGrade) {
          allErrors.push(`[Sheet ${sheetName} Row ${i + 1}] Skip reason: Invalid grade parsed ("${rawGrade}").`);
          continue;
        }

        const student: ParsedStudent = {
          name: name || null,
          grade: normalizedGrade,
          usn: usn || null,
          segment: segment,
        };

        if (!gradeMap[normalizedGrade]) gradeMap[normalizedGrade] = [];
        gradeMap[normalizedGrade].push(student);
      }
    }

    const grades = Object.keys(gradeMap).sort();
    return { grades, students: gradeMap, errors: allErrors };
  } catch (error) {
    return {
      grades: [],
      students: {},
      errors: [`Error parsing XLSX: ${error instanceof Error ? error.message : "Unknown error"}`],
    };
  }
}