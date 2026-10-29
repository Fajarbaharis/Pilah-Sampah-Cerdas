/**
 * Project: BERSEKA
 * Developed by: PT Makerindo
 * Copyright (c) 2026 PT Makerindo. All rights reserved.
 * 
 * Utility: excelReportHelper
 * Standard Industrial & Executive Reporting Styler for Excel (.xlsx) using ExcelJS
 * Menghasilkan spreadsheet resmi dengan tata letak profesional, tipografi konsisten,
 * penomoran teratur, garis tabel rapi, format angka/persentase numerik, dan kop metadata resmi.
 */

import ExcelJS from "exceljs";

export interface ExcelColumnDef {
  header: string;
  key: string;
  width: number;
  align?: "left" | "center" | "right";
  numFmt?: string;
  isBold?: boolean;
}

export interface ExcelMetadataItem {
  label: string;
  value: string | number;
}

export const EXCEL_PALETTE = {
  primary: "009966",      // Emerald BERSEKA
  primaryDark: "007A52",  // Dark Emerald
  navyHeader: "1E293B",   // Slate Navy
  sectionBg: "F1F5F9",    // Light slate section
  headerBg: "009966",     // Header tabel
  headerText: "FFFFFF",   // Teks header
  zebraRow: "F8FAFC",     // Selang-seling baris genap
  totalBg: "E2E8F0",      // Baris total
  borderColor: "CBD5E1",  // Border garis tabel
  borderDark: "94A3B8",   // Border tegas
  textPrimary: "0F172A",  // Teks utama
  textMuted: "475569",    // Teks keterangan
  alertRed: "DC2626",
  alertYellow: "D97706",
};

/**
 * Membuat border tipis rapi standar tabel laporan
 */
export const thinTableBorder: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: EXCEL_PALETTE.borderColor } },
  left: { style: "thin", color: { argb: EXCEL_PALETTE.borderColor } },
  bottom: { style: "thin", color: { argb: EXCEL_PALETTE.borderColor } },
  right: { style: "thin", color: { argb: EXCEL_PALETTE.borderColor } },
};

/**
 * Membuat border ganda di bagian bawah untuk baris TOTAL
 */
export const totalRowBorder: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: EXCEL_PALETTE.borderDark } },
  left: { style: "thin", color: { argb: EXCEL_PALETTE.borderColor } },
  bottom: { style: "double", color: { argb: EXCEL_PALETTE.borderDark } },
  right: { style: "thin", color: { argb: EXCEL_PALETTE.borderColor } },
};

/**
 * Menambahkan Kop Judul Dokumen Resmi di bagian atas Worksheet
 */
export function renderReportHeader(
  ws: ExcelJS.Worksheet,
  title: string,
  subtitle: string,
  metadata: ExcelMetadataItem[],
  maxColLetter: string = "E"
): number {
  // 1. Judul Utama
  const row1 = ws.addRow([title]);
  ws.mergeCells(`A${row1.number}:${maxColLetter}${row1.number}`);
  row1.height = 30;
  const cell1 = ws.getCell(`A${row1.number}`);
  cell1.font = { name: "Segoe UI", size: 13, bold: true, color: { argb: "FFFFFF" } };
  cell1.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: EXCEL_PALETTE.primary },
  };
  cell1.alignment = { vertical: "middle", horizontal: "left", indent: 1 };

  // 2. Subjudul Instansi
  const row2 = ws.addRow([subtitle]);
  ws.mergeCells(`A${row2.number}:${maxColLetter}${row2.number}`);
  row2.height = 20;
  const cell2 = ws.getCell(`A${row2.number}`);
  cell2.font = { name: "Segoe UI", size: 9.5, italic: true, color: { argb: "FFFFFF" } };
  cell2.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: EXCEL_PALETTE.primaryDark },
  };
  cell2.alignment = { vertical: "middle", horizontal: "left", indent: 1 };

  // Baris kosong
  ws.addRow([]);

  // 3. Metadata Card (Waktu Cetak, Filter, Lingkup)
  metadata.forEach((m) => {
    const metaRow = ws.addRow([m.label, m.value]);
    metaRow.height = 18;
    const labelCell = metaRow.getCell(1);
    const valueCell = metaRow.getCell(2);

    labelCell.font = { name: "Segoe UI", size: 9, bold: true, color: { argb: EXCEL_PALETTE.textMuted } };
    labelCell.alignment = { vertical: "middle", horizontal: "left" };

    valueCell.font = { name: "Segoe UI", size: 9, bold: false, color: { argb: EXCEL_PALETTE.textPrimary } };
    valueCell.alignment = { vertical: "middle", horizontal: "left" };
  });

  // Baris kosong setelah metadata
  ws.addRow([]);

  return ws.rowCount + 1;
}

/**
 * Merender satu blok tabel data formal dengan header, borders, alternating colors, dan baris total
 */
export function renderFormalTable<T extends Record<string, any>>(
  ws: ExcelJS.Worksheet,
  options: {
    sectionTitle?: string;
    columns: ExcelColumnDef[];
    data: T[];
    totalRow?: Record<string, any>;
    showRowNumber?: boolean;
    rowNumberHeader?: string;
  }
) {
  const { sectionTitle, columns, data, totalRow, showRowNumber = true, rowNumberHeader = "NO" } = options;

  // 1. Judul Seksi (Opsional)
  if (sectionTitle) {
    const secRow = ws.addRow([sectionTitle]);
    secRow.height = 22;
    const secCell = secRow.getCell(1);
    secCell.font = { name: "Segoe UI", size: 10.5, bold: true, color: { argb: EXCEL_PALETTE.navyHeader } };
    secCell.alignment = { vertical: "middle", horizontal: "left" };
  }

  // Siapkan header kolom
  const allCols: ExcelColumnDef[] = [];
  if (showRowNumber) {
    allCols.push({
      header: rowNumberHeader,
      key: "_rowNo",
      width: 6,
      align: "center",
      isBold: true,
    });
  }
  allCols.push(...columns);

  // 2. Baris Header Kolom
  const headerValues = allCols.map((c) => c.header);
  const headerRow = ws.addRow(headerValues);
  headerRow.height = 24;

  headerRow.eachCell((cell, colIndex) => {
    cell.font = { name: "Segoe UI", size: 9.5, bold: true, color: { argb: "FFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: EXCEL_PALETTE.headerBg },
    };
    cell.alignment = {
      vertical: "middle",
      horizontal: allCols[colIndex - 1]?.align || "left",
      wrapText: true,
    };
    cell.border = thinTableBorder;
  });

  // Set lebar kolom pada worksheet jika belum terpasang atau jika lebih lebar
  allCols.forEach((col, idx) => {
    const currentW = ws.getColumn(idx + 1).width || 0;
    if (col.width > currentW) {
      ws.getColumn(idx + 1).width = col.width;
    }
  });

  // 3. Baris Isi Data
  data.forEach((item, index) => {
    const rowValues = allCols.map((c) => {
      if (c.key === "_rowNo") return index + 1;
      return item[c.key] !== undefined ? item[c.key] : "";
    });

    const dataRow = ws.addRow(rowValues);
    dataRow.height = 19;
    const isEven = index % 2 === 1;

    dataRow.eachCell((cell, colIndex) => {
      const colDef = allCols[colIndex - 1];
      cell.font = {
        name: "Segoe UI",
        size: 9,
        bold: Boolean(colDef?.isBold),
        color: { argb: EXCEL_PALETTE.textPrimary },
      };

      if (isEven) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: EXCEL_PALETTE.zebraRow },
        };
      }

      cell.alignment = {
        vertical: "middle",
        horizontal: colDef?.align || "left",
      };

      if (colDef?.numFmt && typeof cell.value === "number") {
        cell.numFmt = colDef.numFmt;
      }

      cell.border = thinTableBorder;
    });
  });

  // 4. Baris Total (Opsional)
  if (totalRow) {
    const totalValues = allCols.map((c) => {
      if (c.key === "_rowNo") return "";
      return totalRow[c.key] !== undefined ? totalRow[c.key] : "";
    });

    const totalR = ws.addRow(totalValues);
    totalR.height = 22;

    totalR.eachCell((cell, colIndex) => {
      const colDef = allCols[colIndex - 1];
      cell.font = {
        name: "Segoe UI",
        size: 9.5,
        bold: true,
        color: { argb: EXCEL_PALETTE.textPrimary },
      };

      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: EXCEL_PALETTE.totalBg },
      };

      cell.alignment = {
        vertical: "middle",
        horizontal: colDef?.align || "left",
      };

      if (colDef?.numFmt && typeof cell.value === "number") {
        cell.numFmt = colDef.numFmt;
      }

      cell.border = totalRowBorder;
    });
  }

  // Tambahkan baris kosong setelah tabel untuk pemisah visual
  ws.addRow([]);
}
