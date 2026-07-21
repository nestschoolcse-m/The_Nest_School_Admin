import { CachedStudent } from "@/contexts/students-context"

export async function exportReportToPDF(
  date: Date,
  filterType: string,
  filterValue: string,
  totalStudents: number,
  totalEntries: number,
  totalExits: number,
  absentCount: number,
  absentStudents: CachedStudent[],
  missingExits: any[],
  missingEntries: any[]
) {
  // Dynamically import to prevent SSR issues with Next.js
  const { default: jsPDF } = await import("jspdf")
  const { default: autoTable } = await import("jspdf-autotable")

  const doc = new jsPDF()

  // --- Constants for Colors & Styles ---
  const PRIMARY_TEXT = [15, 23, 42];      // Slate 900
  const SECONDARY_TEXT = [71, 85, 105];   // Slate 500
  const MUTED_TEXT = [148, 163, 184];     // Slate 400
  const ACCENT_COLOR = [0, 51, 131];      // Nest Blue
  const BORDER_COLOR = [226, 232, 240];   // Slate 200
  const HEADER_BG = [248, 250, 252];      // Slate 50

  let startY = 15;

  // --- Header ---
  try {
    const res = await fetch("/logo.png")
    const blob = await res.blob()
    const logoBase64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
    
    // Get image dimensions to maintain aspect ratio
    const img = new Image();
    img.src = logoBase64;
    await new Promise((resolve) => {
      img.onload = resolve;
      img.onerror = resolve;
    });

    let targetWidth = 12;
    const targetHeight = 12;
    if (img.width && img.height) {
      const ratio = img.width / img.height;
      targetWidth = targetHeight * ratio;
    }

    // Add logo to PDF
    doc.addImage(logoBase64, 'PNG', 14, startY, targetWidth, targetHeight)
    
    doc.setFont("helvetica", "bold")
    doc.setFontSize(22)
    doc.setTextColor(PRIMARY_TEXT[0], PRIMARY_TEXT[1], PRIMARY_TEXT[2])
    
    // Position text dynamically based on logo width
    const textStartX = 14 + targetWidth + 4;
    doc.text("ATTENDANCE REPORT", textStartX, startY + 8)
  } catch (e) {
    console.warn("Could not load logo for PDF", e)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(22)
    doc.setTextColor(PRIMARY_TEXT[0], PRIMARY_TEXT[1], PRIMARY_TEXT[2])
    doc.text("ATTENDANCE REPORT", 14, startY + 8)
  }
  
  // Date and Filter
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.setTextColor(SECONDARY_TEXT[0], SECONDARY_TEXT[1], SECONDARY_TEXT[2])
  
  const dateStr = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  let filterText = filterType
  if (filterType !== "Whole School" && filterValue) {
    filterText += ` • ${filterValue}`
  }

  // Right-aligned text for Date & Filter
  const pageWidth = doc.internal.pageSize.width || doc.internal.pageSize.getWidth();
  doc.text(`Date: ${dateStr}`, pageWidth - 14, startY + 4, { align: "right" });
  doc.text(`Filter: ${filterText}`, pageWidth - 14, startY + 10, { align: "right" });

  // Divider Line
  startY += 18;
  doc.setDrawColor(BORDER_COLOR[0], BORDER_COLOR[1], BORDER_COLOR[2]);
  doc.setLineWidth(0.5);
  doc.line(14, startY, pageWidth - 14, startY);
  
  // --- Summary Section ---
  startY += 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(PRIMARY_TEXT[0], PRIMARY_TEXT[1], PRIMARY_TEXT[2]);
  doc.text("Metrics Overview", 14, startY);

  startY += 4;
  
  const summaryData = [
    ["Total Students", totalStudents.toString(), "Absent Count", absentCount.toString()],
    ["Total Entries", totalEntries.toString(), "Missing Exits", missingExits.length.toString()],
    ["Total Exits", totalExits.toString(), "Missing Entries", missingEntries.length.toString()],
  ];

  autoTable(doc, {
    startY: startY,
    body: summaryData,
    theme: 'plain',
    styles: {
      font: "helvetica",
      fontSize: 10,
      cellPadding: 4,
      textColor: PRIMARY_TEXT,
    },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: SECONDARY_TEXT, cellWidth: 40 },
      1: { fontStyle: 'bold', textColor: ACCENT_COLOR, cellWidth: 40 },
      2: { fontStyle: 'bold', textColor: SECONDARY_TEXT, cellWidth: 40 },
      3: { fontStyle: 'bold', textColor: ACCENT_COLOR, cellWidth: 40 },
    }
  });

  startY = (doc as any).lastAutoTable.finalY + 12;

  // --- Shared Table Styles ---
  const sharedTableOptions = {
    theme: 'grid' as const,
    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: 6,
      textColor: PRIMARY_TEXT,
      lineColor: BORDER_COLOR,
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: HEADER_BG,
      textColor: SECONDARY_TEXT,
      fontStyle: 'bold' as const,
      halign: 'left' as const,
    },
    alternateRowStyles: {
      fillColor: [252, 252, 253] as [number, number, number],
    },
    margin: { left: 14, right: 14 },
  };

  const renderSection = (title: string, count: number, data: any[], yPos: number) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(PRIMARY_TEXT[0], PRIMARY_TEXT[1], PRIMARY_TEXT[2]);
    doc.text(`${title} (${count})`, 14, yPos);
    
    if (data.length > 0) {
      const tableData = data.map((student, index) => [
        (index + 1).toString(),
        student.usn || "-",
        student.name || "-",
        student.grade || "-",
      ]);

      autoTable(doc, {
        startY: yPos + 4,
        head: [["S.No", "USN", "Name", "Grade"]],
        body: tableData,
        ...sharedTableOptions,
      });
      return (doc as any).lastAutoTable.finalY + 14;
    } else {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(MUTED_TEXT[0], MUTED_TEXT[1], MUTED_TEXT[2]);
      doc.text("No records found for this category.", 14, yPos + 6);
      return yPos + 16;
    }
  };

  // --- Tables ---
  startY = renderSection("Absent Students", absentCount, absentStudents, startY);
  startY = renderSection("Missing Exits", missingExits.length, missingExits, startY);
  startY = renderSection("Missing Entries", missingEntries.length, missingEntries, startY);

  // --- Footer ---
  const pageCount = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(MUTED_TEXT[0], MUTED_TEXT[1], MUTED_TEXT[2]);
    doc.text(
      `Generated by The Nest School • Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.height - 10,
      { align: "center" }
    );
  }

  doc.save(`Attendance_Report_${date.toISOString().split('T')[0]}.pdf`);
}
