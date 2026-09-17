import "server-only";

import fs from "node:fs/promises";
import path from "node:path";
import { jsPDF } from "jspdf";
import { billingAdmin } from "@/lib/billing/server";

export type PublicWorkshopCertificate = {
  recipient_name: string;
  workshop_title: string;
  cohort_label: string;
  workshop_reference: string;
  completed_at: string;
  certificate_issued_at: string;
  status: "verified";
};

function normalizeReference(value: string) {
  const reference = String(value || "").trim().toUpperCase();
  if (!/^PSY-W26-[A-Z0-9]{6}$/.test(reference)) return null;
  return reference;
}

export async function loadPublicWorkshopCertificate(
  rawReference: string,
): Promise<PublicWorkshopCertificate | null> {
  const reference = normalizeReference(rawReference);
  if (!reference) return null;

  const admin = billingAdmin();
  const { data: registration, error } = await admin
    .from("psylattice_workshop_registrations")
    .select(
      "workshop_id, full_name, status, workshop_reference, completed_at, certificate_issued_at",
    )
    .eq("workshop_reference", reference)
    .eq("status", "completed")
    .not("completed_at", "is", null)
    .not("certificate_issued_at", "is", null)
    .maybeSingle();

  if (error) throw error;
  if (!registration) return null;

  const { data: workshop, error: workshopError } = await admin
    .from("psylattice_workshops")
    .select("title, cohort_label")
    .eq("id", registration.workshop_id)
    .maybeSingle();

  if (workshopError) throw workshopError;
  if (!workshop) return null;

  return {
    recipient_name: String(registration.full_name),
    workshop_title: String(workshop.title),
    cohort_label: String(workshop.cohort_label),
    workshop_reference: String(registration.workshop_reference),
    completed_at: String(registration.completed_at),
    certificate_issued_at: String(registration.certificate_issued_at),
    status: "verified",
  };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

function fitSingleLineFontSize(
  doc: jsPDF,
  text: string,
  maxWidth: number,
  preferredSize: number,
  minimumSize: number,
) {
  let size = preferredSize;
  doc.setFontSize(size);

  while (size > minimumSize && doc.getTextWidth(text) > maxWidth) {
    size -= 0.5;
    doc.setFontSize(size);
  }

  return size;
}

function drawCenteredTrackedText(
  doc: jsPDF,
  text: string,
  centerX: number,
  y: number,
  trackingMm: number,
) {
  const glyphWidths = [...text].map((character) => doc.getTextWidth(character));
  const totalWidth =
    glyphWidths.reduce((sum, width) => sum + width, 0) +
    Math.max(0, text.length - 1) * trackingMm;

  let cursorX = centerX - totalWidth / 2;
  [...text].forEach((character, index) => {
    doc.text(character, cursorX, y);
    cursorX += glyphWidths[index] + trackingMm;
  });
}

function drawDiamond(doc: jsPDF, x: number, y: number, size: number) {
  doc.triangle(x, y - size, x + size, y, x, y + size, "F");
  doc.triangle(x, y - size, x - size, y, x, y + size, "F");
}

function drawDotMatrix(
  doc: jsPDF,
  startX: number,
  startY: number,
  columns: number,
  rows: number,
  gap: number,
) {
  doc.setFillColor(210, 240, 247);
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < columns; col += 1) {
      doc.circle(startX + col * gap, startY + row * gap, 0.42, "F");
    }
  }
}

function drawCornerOrnament(doc: jsPDF, x: number, y: number, flipX: 1 | -1, flipY: 1 | -1) {
  doc.setDrawColor(66, 190, 213);
  doc.setLineWidth(0.32);

  doc.line(x, y, x + flipX * 8, y);
  doc.line(x, y, x, y + flipY * 8);
  doc.line(x + flipX * 3, y + flipY * 3, x + flipX * 11, y + flipY * 3);
  doc.line(x + flipX * 3, y + flipY * 3, x + flipX * 3, y + flipY * 11);
}

async function addBrandLogo(doc: jsPDF, pageWidth: number) {
  try {
    const logoPath = path.join(process.cwd(), "public", "psylattice-logo.png");
    const logo = await fs.readFile(logoPath);
    const logoData = `data:image/png;base64,${logo.toString("base64")}`;

    const properties = doc.getImageProperties(logoData);
    const naturalRatio = properties.width / properties.height;

    const maxWidth = 58;
    const maxHeight = 21;
    let logoWidth = maxWidth;
    let logoHeight = logoWidth / naturalRatio;

    if (logoHeight > maxHeight) {
      logoHeight = maxHeight;
      logoWidth = logoHeight * naturalRatio;
    }

    doc.addImage(
      logoData,
      "PNG",
      pageWidth / 2 - logoWidth / 2,
      15.5,
      logoWidth,
      logoHeight,
      undefined,
      "FAST",
    );

    return 15.5 + logoHeight;
  } catch {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(7, 35, 67);
    doc.setFontSize(21);
    doc.text("PsyLattice", pageWidth / 2, 27, { align: "center" });
    return 29;
  }
}

export async function buildWorkshopCertificatePdf(certificate: PublicWorkshopCertificate) {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  const centerX = width / 2;

  // Clean white paper.
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, width, height, "F");

  // Background ornaments are deliberately painted FIRST. The certificate
  // borders are drawn afterward so the ornamentation always sits behind
  // the frame instead of visually cutting through it.
  doc.setDrawColor(224, 248, 251);
  doc.setLineWidth(3.6);
  doc.circle(width - 9.5, 17.5, 17.5, "S");

  doc.setDrawColor(243, 239, 253);
  doc.setLineWidth(3.4);
  doc.circle(9.5, height - 15.5, 14.5, "S");

  drawDotMatrix(doc, width - 17.5, 25.5, 4, 3, 3.1);
  drawDotMatrix(doc, 13.5, height - 23.5, 4, 3, 3.1);

  // Refined double border. Because it is drawn after the background
  // ornamentation, every border segment remains crisp and uninterrupted.
  doc.setDrawColor(93, 208, 225);
  doc.setLineWidth(0.42);
  doc.roundedRect(8, 8, width - 16, height - 16, 5, 5, "S");

  doc.setDrawColor(210, 222, 233);
  doc.setLineWidth(0.24);
  doc.roundedRect(11, 11, width - 22, height - 22, 4, 4, "S");

  // Small academic corner details remain fully inside the inner frame.
  drawCornerOrnament(doc, 15, 15, 1, 1);
  drawCornerOrnament(doc, width - 15, 15, -1, 1);
  drawCornerOrnament(doc, 15, height - 15, 1, -1);
  drawCornerOrnament(doc, width - 15, height - 15, -1, -1);

  const logoBottom = await addBrandLogo(doc, width);

  // Decorative line + diamond beneath the logo.
  const logoRuleY = Math.max(42, logoBottom + 4.5);
  doc.setDrawColor(48, 184, 208);
  doc.setLineWidth(0.32);
  doc.line(centerX - 38, logoRuleY, centerX - 4.5, logoRuleY);
  doc.line(centerX + 4.5, logoRuleY, centerX + 38, logoRuleY);
  doc.setFillColor(48, 184, 208);
  drawDiamond(doc, centerX, logoRuleY, 1.25);

  // Certificate heading. jsPDF's align:center does not account reliably
  // for charSpace in every renderer, so tracked text is positioned glyph by
  // glyph around the true page center. This keeps the heading optically and
  // mathematically centered in the downloadable PDF.
  doc.setFont("helvetica", "bold");
  doc.setTextColor(8, 56, 99);
  doc.setFontSize(13.6);
  drawCenteredTrackedText(
    doc,
    "CERTIFICATE OF COMPLETION",
    centerX,
    57,
    1.28,
  );

  // Recipient block.
  doc.setFont("helvetica", "normal");
  doc.setTextColor(92, 111, 139);
  doc.setFontSize(11.5);
  doc.text("This certifies that", centerX, 72, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setTextColor(3, 13, 38);
  const nameSize = fitSingleLineFontSize(doc, certificate.recipient_name, 215, 28, 19);
  doc.setFontSize(nameSize);
  doc.text(certificate.recipient_name, centerX, 87, { align: "center" });

  // Small divider below participant name.
  doc.setDrawColor(193, 221, 235);
  doc.setLineWidth(0.3);
  doc.line(centerX - 51, 96, centerX - 7, 96);
  doc.line(centerX + 7, 96, centerX + 51, 96);
  doc.setFillColor(132, 180, 220);
  drawDiamond(doc, centerX, 96, 1.25);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(87, 107, 137);
  doc.setFontSize(11.5);
  doc.text("successfully completed the PsyLattice Workshop on", centerX, 109, {
    align: "center",
  });

  // Workshop title - controlled wrapping and dynamic font size to avoid clipping.
  const title = `\"${certificate.workshop_title}\"`;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(9, 25, 57);
  let titleSize = 16.5;
  doc.setFontSize(titleSize);
  let titleLines = doc.splitTextToSize(title, 252) as string[];
  if (titleLines.length > 2) {
    titleSize = 14.5;
    doc.setFontSize(titleSize);
    titleLines = doc.splitTextToSize(title, 252) as string[];
  }
  doc.text(titleLines, centerX, 124, {
    align: "center",
    lineHeightFactor: 1.15,
  });

  const titleLineHeightMm = (titleSize * 0.352778) * 1.15;
  const titleBottomY = 124 + Math.max(0, titleLines.length - 1) * titleLineHeightMm;

  doc.setFont("helvetica", "normal");
  doc.setTextColor(87, 107, 137);
  doc.setFontSize(10.4);
  const description =
    "Covering research design, ambulatory assessment, cognitive tasks and statistical measurement techniques using PsyLattice.";
  const descriptionLines = doc.splitTextToSize(description, 258) as string[];
  doc.text(descriptionLines, centerX, titleBottomY + 11, {
    align: "center",
    lineHeightFactor: 1.22,
  });

  // Metadata area.
  const metadataRuleY = 160;
  doc.setDrawColor(198, 216, 230);
  doc.setLineWidth(0.28);
  doc.line(30, metadataRuleY, width - 30, metadataRuleY);

  const col1 = 68;
  const col2 = centerX;
  const col3 = width - 68;

  // Subtle vertical dividers between metadata columns.
  doc.setDrawColor(213, 224, 234);
  doc.setLineWidth(0.22);
  doc.line((col1 + col2) / 2, 166, (col1 + col2) / 2, 186);
  doc.line((col2 + col3) / 2, 166, (col2 + col3) / 2, 186);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(137, 158, 187);
  doc.setFontSize(8.5);
  drawCenteredTrackedText(doc, "COHORT", col1, 171, 0.58);
  drawCenteredTrackedText(doc, "WORKSHOP REFERENCE", col2, 171, 0.52);
  drawCenteredTrackedText(doc, "STATUS", col3, 171, 0.58);

  doc.setFontSize(11.5);
  doc.setTextColor(39, 61, 94);
  doc.text(certificate.cohort_label, col1, 181, { align: "center" });
  doc.text(certificate.workshop_reference, col2, 181, { align: "center" });

  doc.setTextColor(0, 130, 90);
  doc.text("Verified completion", col3, 181, { align: "center" });

  // Issue date - centered, quiet, and clearly separated from the metadata values.
  doc.setFont("helvetica", "normal");
  doc.setTextColor(133, 151, 181);
  doc.setFontSize(8.3);
  doc.text(`Issued ${formatDate(certificate.certificate_issued_at)}`, centerX, 197, {
    align: "center",
  });

  return Buffer.from(doc.output("arraybuffer"));
}
