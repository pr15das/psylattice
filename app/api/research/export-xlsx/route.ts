import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";

export const runtime = "nodejs";

type ExportSheet = {
  name: string;
  rows: Record<string, unknown>[];
};

type ExportRequest = {
  workbookTitle?: string;
  filename?: string;
  sheets?: ExportSheet[];
};

function safeSheetName(value: string, fallback: string) {
  const cleaned = value
    .replace(/[\\/*?:[\]]/g, " ")
    .trim()
    .slice(0, 31);

  return cleaned || fallback;
}

function safeFilename(value: string) {
  const cleaned = value
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return cleaned || "psylattice-export.xlsx";
}

function excelValue(value: unknown) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  return JSON.stringify(value);
}

export async function POST(
  request: NextRequest
) {
  let body: ExportRequest;

  try {
    body =
      (await request.json()) as ExportRequest;
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "Invalid JSON body.",
      },
      { status: 400 }
    );
  }

  const sheets = body.sheets || [];

  if (
    sheets.length === 0 ||
    sheets.length > 10
  ) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Provide between 1 and 10 worksheets.",
      },
      { status: 400 }
    );
  }

  const workbook = new ExcelJS.Workbook();

  workbook.creator = "PsyLattice";
  workbook.created = new Date();
  workbook.modified = new Date();

  if (body.workbookTitle) {
    workbook.title =
      body.workbookTitle.slice(0, 200);
  }

  let totalRows = 0;

  sheets.forEach((sheet, sheetIndex) => {
    const rows = sheet.rows || [];

    totalRows += rows.length;

    if (totalRows > 200_000) {
      throw new Error(
        "This direct XLSX export is limited to 200,000 total rows. Use CSV or split the export."
      );
    }

    const worksheet =
      workbook.addWorksheet(
        safeSheetName(
          sheet.name,
          `Sheet ${sheetIndex + 1}`
        )
      );

    const columns = Array.from(
      new Set(
        rows.flatMap((row) =>
          Object.keys(row)
        )
      )
    );

    worksheet.columns = columns.map(
      (column) => ({
        header: column,
        key: column,
        width: Math.min(
          45,
          Math.max(12, column.length + 2)
        ),
      })
    );

    for (const row of rows) {
      const normalized: Record<
        string,
        unknown
      > = {};

      for (const column of columns) {
        normalized[column] =
          excelValue(row[column]);
      }

      worksheet.addRow(normalized);
    }

    if (columns.length > 0) {
      worksheet.views = [
        {
          state: "frozen",
          ySplit: 1,
        },
      ];

      worksheet.autoFilter = {
        from: {
          row: 1,
          column: 1,
        },
        to: {
          row: 1,
          column: columns.length,
        },
      };

      const header = worksheet.getRow(1);
      header.font = {
        bold: true,
      };
    }
  });

  let responseBody: Blob;

  try {
    const excelBuffer =
      await workbook.xlsx.writeBuffer();

    // Blob is a valid Web BodyInit for NextResponse.
    // ExcelJS may type its output as a Node Buffer / ArrayBuffer-like
    // object depending on the environment, so the cast is isolated here.
    responseBody = new Blob(
      [excelBuffer as unknown as BlobPart],
      {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error?.message ||
          "The XLSX workbook could not be generated.",
      },
      { status: 500 }
    );
  }

  const filename = safeFilename(
    body.filename ||
      "psylattice-export.xlsx"
  );

  return new NextResponse(responseBody, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`}"`,
      "Cache-Control": "no-store",
    },
  });
}
