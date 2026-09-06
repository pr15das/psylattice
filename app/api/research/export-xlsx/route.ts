import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ExportSheet = {
  name: string;
  kind?: "meta" | "clean" | "raw" | "codebook";
  description?: string;
  rows: Record<string, unknown>[];
};

type ExportRequest = {
  workbookTitle?: string;
  filename?: string;
  sheets?: ExportSheet[];
};

const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const MAX_REQUEST_BYTES = 64 * 1024 * 1024;
const MAX_TOTAL_CELLS = 8_000_000;
const MAX_CELL_CHARS = 32_767;

function safeSheetName(value: string, fallback: string) {
  const cleaned = value
    .replace(/[\\/*?:[\]]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 31);

  return cleaned || fallback;
}

function uniqueSheetName(
  value: string,
  fallback: string,
  used: Set<string>
) {
  const base = safeSheetName(value, fallback);
  let candidate = base;
  let suffix = 2;

  while (used.has(candidate.toLowerCase())) {
    const tail = ` ${suffix}`;
    candidate = `${base.slice(0, Math.max(1, 31 - tail.length))}${tail}`;
    suffix += 1;
  }

  used.add(candidate.toLowerCase());
  return candidate;
}

function safeFilename(value: string) {
  const cleaned = value
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return cleaned || "psylattice-research-export.xlsx";
}

function excelValue(value: unknown) {
  if (value === null || value === undefined) return "";
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function headerPalette(kind: ExportSheet["kind"]) {
  if (kind === "raw") {
    return { fill: "FFF7ED", font: "FF9A3412", tab: "FFF59E0B" };
  }
  if (kind === "clean") {
    return { fill: "FFECFEFF", font: "FF155E75", tab: "FF06B6D4" };
  }
  if (kind === "codebook") {
    return { fill: "FFF1F5F9", font: "FF334155", tab: "FF64748B" };
  }
  return { fill: "FFE2E8F0", font: "FF0F172A", tab: "FF0F172A" };
}

function columnWidth(
  column: string,
  rows: Record<string, unknown>[]
) {
  const lower = column.toLowerCase();

  if (
    lower.includes("json") ||
    lower.includes("prompt") ||
    lower.includes("notes") ||
    lower.includes("description") ||
    lower.includes("response_payload") ||
    lower.includes("stimulus_payload") ||
    lower.includes("timing_quality")
  ) {
    return 34;
  }

  let width = Math.max(11, column.length + 2);
  for (const row of rows.slice(0, 80)) {
    const value = excelValue(row[column]);
    if (value === "") continue;
    width = Math.max(width, Math.min(36, String(value).length + 2));
  }
  return Math.min(36, width);
}

function applyNumberFormat(
  worksheet: ExcelJS.Worksheet,
  column: string,
  columnIndex: number
) {
  const lower = column.toLowerCase();
  const excelColumn = worksheet.getColumn(columnIndex);

  if (
    lower === "accuracy" ||
    lower.endsWith("_accuracy") ||
    lower === "refresh_stability"
  ) {
    excelColumn.numFmt = "0.0%";
    return;
  }

  if (
    lower.includes("reaction_time_ms") ||
    lower.endsWith("_rt_ms") ||
    lower.includes("latency_minutes") ||
    lower === "refresh_hz"
  ) {
    excelColumn.numFmt = "0.00";
    return;
  }

  if (lower.endsWith("_percent")) {
    excelColumn.numFmt = "0.0";
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { ok: false, error: "Authentication is required to generate a research export." },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
    return NextResponse.json(
      { ok: false, error: "The export request is too large." },
      { status: 413, headers: { "Cache-Control": "no-store" } }
    );
  }

  let body: ExportRequest;

  try {
    body = (await request.json()) as ExportRequest;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const sheets = Array.isArray(body.sheets) ? body.sheets : [];

  if (sheets.length === 0 || sheets.length > 32) {
    return NextResponse.json(
      {
        ok: false,
        error: "Provide between 1 and 32 worksheets.",
      },
      { status: 400 }
    );
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "PsyLattice";
  workbook.company = "PsyLattice";
  workbook.subject = "PsyLattice research data export";
  workbook.created = new Date();
  workbook.modified = new Date();
  workbook.calcProperties.fullCalcOnLoad = false;

  if (body.workbookTitle) {
    workbook.title = body.workbookTitle.slice(0, 200);
  }

  let totalRows = 0;
  let totalCells = 0;
  const usedNames = new Set<string>();

  try {
    sheets.forEach((sheet, sheetIndex) => {
      const rows = Array.isArray(sheet.rows) ? sheet.rows : [];
      if (rows.length > 1_000_000) {
        throw new Error(
          `Worksheet ${sheet.name || sheetIndex + 1} has more than 1,000,000 data rows. Excel worksheets cannot safely hold that many rows; export that raw dataset as CSV or split it.`
        );
      }

      totalRows += rows.length;

      if (totalRows > 500_000) {
        throw new Error(
          "This direct multi-sheet Excel export is limited to 500,000 total data rows to keep browser/server memory use predictable. Use the clean workbook for analysis and export very large raw datasets individually as CSV."
        );
      }

      const worksheet = workbook.addWorksheet(
        uniqueSheetName(sheet.name, `Sheet ${sheetIndex + 1}`, usedNames)
      );
      const palette = headerPalette(sheet.kind);
      worksheet.properties.tabColor = { argb: palette.tab };
      worksheet.properties.defaultRowHeight = 18;
      worksheet.views = [{ state: "frozen", ySplit: 1 }];

      const columns = Array.from(
        rows.reduce((set, row) => {
          Object.keys(row || {}).forEach((key) => set.add(key));
          return set;
        }, new Set<string>())
      );

      if (columns.length > 16_000) {
        throw new Error(
          `Worksheet ${sheet.name || sheetIndex + 1} has ${columns.length.toLocaleString()} columns, which is too close to Excel's worksheet limit. Use long/raw exports or reduce the selected variables.`
        );
      }

      totalCells += rows.length * columns.length;
      if (totalCells > MAX_TOTAL_CELLS) {
        throw new Error("This export is too large to generate safely. Reduce the selected data or export a smaller dataset.");
      }

      for (const row of rows) {
        for (const column of columns) {
          const value = excelValue(row[column]);
          if (typeof value === "string" && value.length > MAX_CELL_CHARS) {
            throw new Error("This export contains a cell value that is too large for Excel.");
          }
        }
      }

      if (columns.length === 0) {
        worksheet.getCell("A1").value = "No rows in this dataset for the current export filters.";
        worksheet.getCell("A1").font = { bold: true, color: { argb: palette.font } };
        worksheet.getCell("A1").fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: palette.fill },
        };
        worksheet.getColumn(1).width = 56;
        return;
      }

      worksheet.columns = columns.map((column) => ({
        header: column,
        key: column,
        width: columnWidth(column, rows),
      }));

      for (const row of rows) {
        const normalized: Record<string, unknown> = {};
        for (const column of columns) {
          normalized[column] = excelValue(row[column]);
        }
        worksheet.addRow(normalized);
      }

      const header = worksheet.getRow(1);
      header.height = 24;
      header.font = {
        bold: true,
        color: { argb: palette.font },
      };
      header.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: palette.fill },
      };
      header.alignment = {
        vertical: "middle",
        wrapText: true,
      };
      header.eachCell((cell) => {
        cell.border = {
          bottom: {
            style: "thin",
            color: { argb: "FFCBD5E1" },
          },
        };
      });

      worksheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1, column: columns.length },
      };

      columns.forEach((column, index) => {
        applyNumberFormat(worksheet, column, index + 1);
        const lower = column.toLowerCase();
        if (
          lower.includes("json") ||
          lower.includes("prompt") ||
          lower.includes("notes") ||
          lower.includes("description")
        ) {
          worksheet.getColumn(index + 1).alignment = {
            vertical: "top",
            wrapText: true,
          };
        } else {
          worksheet.getColumn(index + 1).alignment = {
            vertical: "top",
          };
        }
      });

      // Lightweight row banding improves navigation without the memory cost of
      // converting every large raw sheet into an Excel table.
      if (rows.length <= 10_000) {
        for (let rowIndex = 2; rowIndex <= worksheet.rowCount; rowIndex += 2) {
          const row = worksheet.getRow(rowIndex);
          row.eachCell((cell) => {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFFAFAFA" },
            };
          });
        }
      }

      if (sheet.description) {
        worksheet.headerFooter.oddFooter = `PsyLattice · ${sheet.description.slice(0, 180)}`;
      }
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "The Excel workbook could not be prepared." },
      { status: 400 }
    );
  }

  let responseBody: Blob;

  try {
    const excelBuffer = await workbook.xlsx.writeBuffer();
    responseBody = new Blob([excelBuffer as unknown as BlobPart], {
      type: XLSX_MIME,
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "The XLSX workbook could not be generated.",
      },
      { status: 500 }
    );
  }

  const filename = safeFilename(
    body.filename || "psylattice-research-export.xlsx"
  );

  return new NextResponse(responseBody, {
    status: 200,
    headers: {
      "Content-Type": XLSX_MIME,
      "Content-Disposition": `attachment; filename="${
        filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`
      }"`,
      "Cache-Control": "private, no-store, max-age=0",
    },
  });
}
