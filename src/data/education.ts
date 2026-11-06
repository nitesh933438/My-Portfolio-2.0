/**
 * Centralized Academic Data Architecture
 * 
 * Future-Ready: To update in the future, simply edit this file:
 * - Add Semester 3, 4, etc. results
 * - Update upcoming semester statuses & declaration dates
 * - Add CGPA when officially published by the university
 * - Add new degrees or certifications
 * 
 * Strict Academic Accuracy:
 * - Real official SGPAs are displayed as awarded without unverified percentage conversions.
 * - CGPA remains hidden until officially declared by the university.
 * - No personal identifying numbers (Roll, Reg, DOB) are displayed.
 */

export type SemesterStatus = 'PASS' | 'FAIL' | 'UPCOMING' | 'RESULT_AWAITED';

export interface SemesterResult {
  semesterNumber: number;
  semesterLabel: string;
  academicYear?: string;
  sgpa?: number;
  resultDeclarationDate?: string;
  status: SemesterStatus;
  statusLabel: string;
  isDeclared: boolean;
}

export interface UniversityRecord {
  id: string;
  type: 'university';
  institution: string;
  degree: string;
  branch: string;
  session: string;
  status: string;
  location: string;
  description: string;
  semesters: SemesterResult[];
  // Official CGPA - kept undefined/hidden until officially published
  cgpa?: number;
  cgpaMax?: number;
  highlights: string[];
}

export interface SchoolRecord {
  id: string;
  type: 'school';
  standard: 'Class 10th' | 'Class 12th';
  qualificationTitle: string;
  board: string;
  boardFullName: string;
  stream?: string;
  passingYear: string;
  totalMarks: number;
  maxMarks: number;
  percentage: number; // e.g. 79.8
  division: string;
  status: 'Passed' | 'Completed';
  location: string;
  description: string;
  highlights: string[];
}

export type AcademicRecord = UniversityRecord | SchoolRecord;

export interface AcademicProfileData {
  title: string;
  subtitle: string;
  overview: string;
  university: UniversityRecord;
  schooling: SchoolRecord[];
}

export const ACADEMIC_DATA: AcademicProfileData = {
  title: "Academic Journey",
  subtitle: "Education & Qualifications",
  overview: "A verified academic foundation spanning core Computer Science & Engineering at university level and distinguished secondary school records.",
  
  // B.Tech at Arka Jain University
  university: {
    id: "arka-jain-btech-cse",
    type: "university",
    institution: "Arka Jain University",
    degree: "Bachelor of Technology (B.Tech)",
    branch: "Computer Science and Engineering",
    session: "2025 – 2029",
    status: "Currently Pursuing",
    location: "Jharkhand, India",
    description: "Rigorous undergraduate curriculum with deep focus on algorithmic problem solving, modern software architectures, data structures, and computer science principles.",
    // Future-ready semester dashboard: 8 full semesters
    semesters: [
      {
        semesterNumber: 1,
        semesterLabel: "Semester 1",
        academicYear: "2025–2026",
        sgpa: 7.91,
        resultDeclarationDate: "28 February 2026",
        status: "PASS",
        statusLabel: "Pass",
        isDeclared: true,
      },
      {
        semesterNumber: 2,
        semesterLabel: "Semester 2",
        academicYear: "2025–2026",
        sgpa: 9.23,
        resultDeclarationDate: "20 July 2026",
        status: "PASS",
        statusLabel: "Pass",
        isDeclared: true,
      },
      {
        semesterNumber: 3,
        semesterLabel: "Semester 3",
        academicYear: "2026–2027",
        status: "UPCOMING",
        statusLabel: "Upcoming",
        isDeclared: false,
      },
      {
        semesterNumber: 4,
        semesterLabel: "Semester 4",
        academicYear: "2026–2027",
        status: "UPCOMING",
        statusLabel: "Upcoming",
        isDeclared: false,
      },
      {
        semesterNumber: 5,
        semesterLabel: "Semester 5",
        academicYear: "2027–2028",
        status: "UPCOMING",
        statusLabel: "Upcoming",
        isDeclared: false,
      },
      {
        semesterNumber: 6,
        semesterLabel: "Semester 6",
        academicYear: "2027–2028",
        status: "UPCOMING",
        statusLabel: "Upcoming",
        isDeclared: false,
      },
      {
        semesterNumber: 7,
        semesterLabel: "Semester 7",
        academicYear: "2028–2029",
        status: "UPCOMING",
        statusLabel: "Upcoming",
        isDeclared: false,
      },
      {
        semesterNumber: 8,
        semesterLabel: "Semester 8",
        academicYear: "2028–2029",
        status: "UPCOMING",
        statusLabel: "Upcoming",
        isDeclared: false,
      },
    ],
    // Kept undefined until officially available
    cgpa: undefined,
    highlights: [
      "Semester 1 SGPA: 7.91 (Declared 28 Feb 2026)",
      "Semester 2 SGPA: 9.23 (Declared 20 Jul 2026)",
      "Strong academic trajectory with 9+ SGPA in Semester 2",
      "Specialization in Full-Stack Web Systems & Intelligent AI Agents"
    ]
  },

  // School Qualifications
  schooling: [
    {
      id: "bseb-class-12",
      type: "school",
      standard: "Class 12th",
      qualificationTitle: "Intermediate (Class 12th)",
      board: "BSEB",
      boardFullName: "Bihar School Examination Board",
      stream: "Science",
      passingYear: "2025",
      totalMarks: 393,
      maxMarks: 500,
      percentage: 78.6,
      division: "First Division",
      status: "Passed",
      location: "Bihar, India",
      description: "Higher Secondary science curriculum under the Bihar School Examination Board, establishing strong quantitative reasoning and scientific discipline.",
      highlights: [
        "Stream: Science",
        "Score: 393 / 500 (78.6%)",
        "Division: First Division",
        "Passing Year: 2025"
      ]
    },
    {
      id: "bseb-class-10",
      type: "school",
      standard: "Class 10th",
      qualificationTitle: "Matriculation (Class 10th)",
      board: "BSEB",
      boardFullName: "Bihar School Examination Board",
      passingYear: "2023",
      totalMarks: 399,
      maxMarks: 500,
      percentage: 79.8,
      division: "First Division",
      status: "Passed",
      location: "Bihar, India",
      description: "Secondary school education completing comprehensive foundations in Mathematics, Science, and Social Sciences with distinguished first division performance.",
      highlights: [
        "Score: 399 / 500 (79.8%)",
        "Division: First Division",
        "Passing Year: 2023",
        "Board: Bihar School Examination Board (BSEB)"
      ]
    }
  ]
};
