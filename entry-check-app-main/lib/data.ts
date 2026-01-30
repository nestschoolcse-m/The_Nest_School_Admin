// Dummy data for the school entry check app

export interface Student {
  id: string;
  sno: number;
  name: string;
  admissionNumber: string;
  grade: string;
  section: string;
  gender: string;
  modeOfTransport: string;
  usnNumber: string;
  parentCard: string;
  dateOfBirth: string;
  bloodGroup: string;
  photo?: string;
  parentPhoto?: string;
  todayTransport?: string;
}

export const students: Student[] = [
  {
    id: "1",
    sno: 1,
    name: "Roxanne R",
    admissionNumber: "NP25026",
    grade: "PRE-KG",
    section: "A",
    gender: "Female",
    modeOfTransport: "parent",
    usnNumber: "NP25025_L01",
    parentCard: "NP25025_P01",
    dateOfBirth: "23/09/2022",
    bloodGroup: "O +ve",
  },
  {
    id: "2",
    sno: 2,
    name: "Mitakshi A",
    admissionNumber: "NP25006",
    grade: "PRE-KG",
    section: "A",
    gender: "Female",
    modeOfTransport: "parent",
    usnNumber: "NP25006_L01",
    parentCard: "NP25006_P01",
    dateOfBirth: "30-Jul-22",
    bloodGroup: "AB +ve",
  },
  {
    id: "3",
    sno: 3,
    name: "Miliran",
    admissionNumber: "NP25024",
    grade: "PRE-KG",
    section: "A",
    gender: "Male",
    modeOfTransport: "parent",
    usnNumber: "NP25024_L01",
    parentCard: "NP25024_P01",
    dateOfBirth: "07/11/2022",
    bloodGroup: "A +ve",
  },
  {
    id: "4",
    sno: 4,
    name: "Kriyanshi Jain AS",
    admissionNumber: "NP25005",
    grade: "PRE-KG",
    section: "A",
    gender: "Female",
    modeOfTransport: "parent",
    usnNumber: "NP25005_L01",
    parentCard: "NP25005_P01",
    dateOfBirth: "12-02-22",
    bloodGroup: "O +ve",
  },
  {
    id: "5",
    sno: 5,
    name: "Adwaith Jishnav",
    admissionNumber: "NP25002",
    grade: "PRE-KG",
    section: "A",
    gender: "Male",
    modeOfTransport: "parent",
    usnNumber: "NP25002_L01",
    parentCard: "NP25002_P01",
    dateOfBirth: "19-Dec-21",
    bloodGroup: "B +ve",
  },
  {
    id: "6",
    sno: 6,
    name: "Jayanthy Sundararaju",
    admissionNumber: "NP25020",
    grade: "PRE-KG",
    section: "A",
    gender: "Female",
    modeOfTransport: "parent",
    usnNumber: "NP25020_L01",
    parentCard: "NP25020_P01",
    dateOfBirth: "14-Mar-22",
    bloodGroup: "O +ve",
  },
  {
    id: "7",
    sno: 7,
    name: "Vriksha Vignesh",
    admissionNumber: "NG125003",
    grade: "I",
    section: "A",
    gender: "Male",
    modeOfTransport: "bus",
    usnNumber: "NG125003_L01",
    parentCard: "NG125003_P01",
    dateOfBirth: "23/09/2022",
    bloodGroup: "A+",
  },
  {
    id: "8",
    sno: 8,
    name: "Saaral Arulnithi",
    admissionNumber: "NP24016",
    grade: "LKG",
    section: "B",
    gender: "Male",
    modeOfTransport: "parent",
    usnNumber: "NP24016_L01",
    parentCard: "NP24016_P01",
    dateOfBirth: "27-Sep-22",
    bloodGroup: "A +ve",
  },
  {
    id: "9",
    sno: 9,
    name: "LABDHI A",
    admissionNumber: "NG123005",
    grade: "III",
    section: "A",
    gender: "Female",
    modeOfTransport: "bus",
    usnNumber: "NG123005_L01",
    parentCard: "NG123005_P01",
    dateOfBirth: "16-Jul-22",
    bloodGroup: "B +ve",
  },
  {
    id: "10",
    sno: 10,
    name: "Keshav Kapil",
    admissionNumber: "NL23027",
    grade: "I",
    section: "B",
    gender: "Male",
    modeOfTransport: "bus",
    usnNumber: "NL23027_L01",
    parentCard: "NL23027_P01",
    dateOfBirth: "23-Nov-21",
    bloodGroup: "O +ve",
  },
  {
    id: "11",
    sno: 11,
    name: "Sarah Aafiyah Fauz",
    admissionNumber: "NG425007",
    grade: "IV",
    section: "A",
    gender: "Female",
    modeOfTransport: "bus",
    usnNumber: "NG425007_L01",
    parentCard: "NG425007_P01",
    dateOfBirth: "29-Mar-22",
    bloodGroup: "O +ve",
  },
  {
    id: "12",
    sno: 12,
    name: "Nilan P M",
    admissionNumber: "NL24024",
    grade: "UKG",
    section: "B",
    gender: "Male",
    modeOfTransport: "bus",
    usnNumber: "NL24024_L01",
    parentCard: "NL24024_P01",
    dateOfBirth: "25-Jun-22",
    bloodGroup: "AB +ve",
  },
  {
    id: "13",
    sno: 13,
    name: "Priyansih Jain",
    admissionNumber: "NP25013",
    grade: "PRE-KG",
    section: "A",
    gender: "Female",
    modeOfTransport: "parent",
    usnNumber: "NP25013_L01",
    parentCard: "NP25013_P01",
    dateOfBirth: "13-06-22",
    bloodGroup: "O +ve",
  },
  {
    id: "14",
    sno: 14,
    name: "Meesha Mervin",
    admissionNumber: "NP25018",
    grade: "PRE-KG",
    section: "A",
    gender: "Female",
    modeOfTransport: "parent",
    usnNumber: "NP25018_L01",
    parentCard: "NP25018_P01",
    dateOfBirth: "06-Feb-22",
    bloodGroup: "O +ve",
  },
  {
    id: "15",
    sno: 15,
    name: "Kavya Naveen",
    admissionNumber: "NP25011",
    grade: "PRE-KG",
    section: "A",
    gender: "Female",
    modeOfTransport: "parent",
    usnNumber: "NP25011_L01",
    parentCard: "NP25011_P01",
    dateOfBirth: "16-Jul-22",
    bloodGroup: "B +ve",
  },
];

export interface DashboardStats {
  totalStudents: number;
  studentsEntry: number;
  studentExit: number;
  earlierPickups: number;
  afterSchool: number;
  campusExit: number;
}

export const dashboardStats: DashboardStats = {
  totalStudents: 353,
  studentsEntry: 262,
  studentExit: 0,
  earlierPickups: 0,
  afterSchool: 0,
  campusExit: 0,
};

export interface GradeAttendance {
  grade: string;
  strength: number;
  present: number;
}

export const gradeAttendance: GradeAttendance[] = [
  { grade: "PRE-KG", strength: 45, present: 38 },
  { grade: "LKG", strength: 52, present: 48 },
  { grade: "UKG", strength: 48, present: 42 },
  { grade: "I", strength: 55, present: 50 },
  { grade: "II", strength: 50, present: 45 },
  { grade: "III", strength: 53, present: 48 },
  { grade: "IV", strength: 50, present: 45 },
];

export const grades = [
  "PRE-KG",
  "LKG",
  "UKG",
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
  "IX",
  "X",
];
export const sections = ["NILL", "A", "B", "C"];
export const genders = ["Male", "Female"];
export const transportModes = ["Parent", "Bus", "Van", "Auto"];
