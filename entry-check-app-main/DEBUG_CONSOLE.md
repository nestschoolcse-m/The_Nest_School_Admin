# 🔍 File Upload Debugging - Complete Guide

## Your File Issue

You're getting **0 students and 0 grades** from your file. This means:

- ✗ No header row detected, OR
- ✗ No valid student data rows found

## 🚀 How to Debug - Step by Step

### Step 1: Open Browser Console While Uploading

1. **Close all browser windows**
2. **Open your app** in the browser
3. **Press `F12`** to open Developer Tools
4. **Go to "Console" tab**
5. **Clear any existing logs** (right-click → Clear messages)
6. **Click "Bulk Upload"** button
7. **Upload your file**
8. **Watch the console** for detailed logs

### Step 2: Look for Key Console Messages

You should see output like:

```
=== HEADER DETECTION START ===
Searching for header row in first 20 rows...
Row 0: [sl no, name of student, dob, ...] | non-empty: 12 | matches: 3 | typical: true
  ✓ New best match (score: 3.5)
Row 1: [1, John Doe, 2015-05-20, ...] | non-empty: 12 | matches: 0 | typical: false

Best match: row 0 with score 3.5
Header row data: ["sl no", "name of student", "dob", ...]
Mapped columns: {sNo: 0, name: 1, usn: 2, dob: 3, ...}
=== HEADER DETECTION END ===

=== PROCESSING "GR 1" DATA ROWS ===
Column map: sNo=0, name=1, usn=2
Row 1: [1, John Doe, NG924001, ...]
  ✓ Parsed: John Doe | NG924001 | 2015-05-20
Sheet "GR 1" summary: 25 valid students, 5 rows skipped
=== END "GR 1" ===
```

### Step 3: Share Console Output

Copy ALL the console output and share it. Key things I need to see:

1. **Sheet names** - What sheets are in your file?
2. **Header detection** - What row was detected as header?
3. **Column mapping** - Which columns matched?
4. **Row processing** - How many rows were found? Why were rows skipped?

## 🆘 Common Issues & Solutions

| Issue                           | Solution                                                                          |
| ------------------------------- | --------------------------------------------------------------------------------- |
| "No header row found"           | Your column names might be different. Check the actual column names in your file. |
| "Found 0 students"              | Either S.No column is wrong, or student rows don't have USN values.               |
| "Found N grades but 0 students" | Header detected but no valid student rows. Check data format.                     |
| Sheets not showing in dropdown  | Sheet names don't match "GR" pattern. Check exact sheet names.                    |

## 📋 What Your File Needs

### Absolute Requirements:

1. **USN column** - Every student MUST have a USN (unique identifier)
2. **Student names** - At least the student name column must exist
3. **Header row** - First row(s) must have column labels

### Good to Have:

- S.No column with sequential numbers (1, 2, 3...)
- DOB column in a recognizable format
- Father/Mother names and phone numbers

### File Structure Example:

```
Sheet: "GR 1"
Row 1 (Header):  | S.No | Name of Student | USN Number | DOB | Father Name | Father Mobile |
Row 2 (Data):    | 1    | John Doe        | NG924001   | ... | Mr. John    | 9876543210    |
Row 3 (Data):    | 2    | Jane Smith      | NG924002   | ... | Mr. Smith   | 9876543211    |
...
```

## 🔧 Troubleshooting Steps

### If header isn't detected:

1. **Check your column names** - Open file in Excel
2. **Screenshot the header row**
3. **Note exact column names** - spelling, spacing, punctuation
4. **Upload again with console open** - share the console log

### If rows aren't parsed:

1. **Check if USN column has values** - empty cells will be skipped
2. **Check student names** - rows need at least a name OR USN
3. **Upload with console open** - share logs showing which rows were skipped

### Quick Test:

Create a minimal test file:

**Sheet: "Test"**

```
S.No | Name | USN | DOB
1    | Test | T1  | 2015-01-01
2    | Test2| T2  | 2015-01-02
```

Upload this. If it works, your issue is with your actual file format.

## 📊 File Checklist

Before uploading, verify:

- [ ] File is .xlsx (not .xls or .csv)
- [ ] Sheets are named "GR 1", "GR 2", etc. (or with sections: "GR 1 A", "GR 1 B")
- [ ] Header row is in row 1 (or within first 5 rows)
- [ ] Every student has a USN value
- [ ] No completely blank rows in the middle of data
- [ ] Column names are clearly visible
- [ ] No special characters or encoding issues

## 📞 Getting Help

When you come back with the console output, include:

1. **Console screenshot or full text**
2. **Screenshot of your Excel header row**
3. **Exact sheet names**
4. **Number of students in each sheet**

This will help me identify exactly why your file isn't parsing correctly!
