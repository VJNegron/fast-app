// ─── pdfExport.js ────────────────────────────────────────────────────────────
// Generates a branded F.A.S.T. recommendation PDF (navy/gold layout).
// Uses jsPDF — no server round-trip needed.

import jsPDF from "jspdf";

// Brand colors as RGB arrays for jsPDF
const C = {
  navy: [13, 27, 42],
  gold: [201, 168, 76],
  accent: [26, 58, 92],
  cream: [255, 248, 231],
  gray: [245, 245, 245],
  text: [55, 65, 81],
  muted: [138, 147, 163],
  red: [192, 57, 43],
};

const PAGE_W = 215.9; // letter
const PAGE_H = 279.4;
const MARGIN = 20;
const CONTENT_W = PAGE_W - MARGIN * 2;

function setFill(doc, color) { doc.setFillColor(...color); }
function setDraw(doc, color) { doc.setDrawColor(...color); }
function setTxt(doc, color) { doc.setTextColor(...color); }

// Wraps text and returns the new Y after drawing
function drawWrapped(doc, text, x, y, maxWidth, lineH = 5.5) {
  const lines = doc.splitTextToSize(text || "—", maxWidth);
  doc.text(lines, x, y);
  return y + lines.length * lineH;
}

// Section heading with gold underbar
function sectionHeading(doc, title, y) {
  doc.setFont("times", "bold");
  doc.setFontSize(13);
  setTxt(doc, C.navy);
  doc.text(title, MARGIN, y);
  setDraw(doc, C.gold);
  doc.setLineWidth(0.4);
  doc.line(MARGIN, y + 1.5, MARGIN + doc.getTextWidth(title) + 2, y + 1.5);
  return y + 9;
}

// Guard for page overflow — adds a page and resets y
function guardPage(doc, y, neededSpace = 20) {
  if (y + neededSpace > PAGE_H - 22) {
    doc.addPage();
    return 22;
  }
  return y;
}

export function exportRecommendationPDF(result, brain) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "letter" });

  // ── HEADER BAND ──────────────────────────────────────────────────────────
  setFill(doc, C.navy);
  doc.rect(0, 0, PAGE_W, 45, "F");

  // Wordmark
  doc.setFont("times", "bold");
  doc.setFontSize(26);
  setTxt(doc, C.gold);
  doc.text("F.A.S.T.", MARGIN, 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  setTxt(doc, C.muted);
  doc.text("Financial Advisory Stewardship Technology", MARGIN, 25);
  if (brain.advisorName) {
    doc.text(`${brain.advisorName}${brain.firm ? "  ·  " + brain.firm : ""}`, MARGIN, 31);
  }
  doc.text(`Generated ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`, MARGIN, 37);

  // Model Seal (right side of header)
  const sealCx = PAGE_W - MARGIN - 18;
  const sealCy = 22;
  setDraw(doc, C.gold);
  doc.setLineWidth(1.2);
  doc.circle(sealCx, sealCy, 14, "D");
  doc.setFont("times", "bold");
  doc.setFontSize(24);
  setTxt(doc, C.gold);
  doc.text(result.modelMatch || "?", sealCx, sealCy + 4.5, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  setTxt(doc, C.muted);
  doc.text("MODEL MATCH", sealCx, sealCy + 12, { align: "center" });

  // ── MODEL TITLE ──────────────────────────────────────────────────────────
  let y = 56;
  doc.setFont("times", "bold");
  doc.setFontSize(17);
  setTxt(doc, C.navy);
  doc.text(`Model ${result.modelMatch} — ${result.modelName || ""}`, MARGIN, y);
  y += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  setTxt(doc, C.accent);
  doc.text(`Confidence: ${result.confidence || "—"}`, MARGIN, y);
  y += 10;

  setDraw(doc, C.gold);
  doc.setLineWidth(0.5);
  doc.line(MARGIN, y, MARGIN + 55, y);
  y += 9;

  // ── CLIENT SNAPSHOT ──────────────────────────────────────────────────────
  y = sectionHeading(doc, "Client Snapshot", y);
  const snap = result.clientSnapshot || {};
  const snapRows = [
    ["Client", snap.name],
    ["Estimated Assets", snap.estimatedAssets],
    ["Risk Indicators", snap.riskIndicators],
    ["Current Holdings", snap.keyHoldings],
  ];

  doc.setFontSize(9.5);
  snapRows.forEach(([label, value]) => {
    y = guardPage(doc, y, 14);
    doc.setFont("helvetica", "bold");
    setTxt(doc, C.accent);
    doc.text(`${label}:`, MARGIN, y);
    doc.setFont("helvetica", "normal");
    setTxt(doc, C.text);
    const labelW = doc.getTextWidth(`${label}:`) + 3;
    y = drawWrapped(doc, value || "Not stated", MARGIN + labelW, y, CONTENT_W - labelW);
    y += 2;
  });
  y += 5;

  // ── RATIONALE ────────────────────────────────────────────────────────────
  y = guardPage(doc, y, 30);
  setDraw(doc, C.gold);
  doc.setLineWidth(1.2);
  doc.line(MARGIN, y - 2, MARGIN, y + 22);

  doc.setFont("times", "bold");
  doc.setFontSize(13);
  setTxt(doc, C.navy);
  doc.text("Why This Model — Your Logic", MARGIN + 5, y);
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  setTxt(doc, C.text);
  y = drawWrapped(doc, result.rationale || "", MARGIN + 5, y, CONTENT_W - 8);
  y += 10;

  // ── ADJUSTMENTS ──────────────────────────────────────────────────────────
  if (result.adjustments?.length) {
    y = guardPage(doc, y, 20);
    y = sectionHeading(doc, "Adjustments for This Client", y);
    doc.setFontSize(9.5);
    result.adjustments.forEach((adj) => {
      y = guardPage(doc, y, 12);
      doc.setFont("helvetica", "normal");
      setTxt(doc, C.gold);
      doc.text("◆", MARGIN, y);
      setTxt(doc, C.text);
      y = drawWrapped(doc, adj, MARGIN + 6, y, CONTENT_W - 8);
      y += 3;
    });
    y += 5;
  }

  // ── TALKING POINTS ───────────────────────────────────────────────────────
  if (result.talkingPoints?.length) {
    y = guardPage(doc, y, 20);
    y = sectionHeading(doc, "Meeting Talking Points", y);
    doc.setFontSize(9.5);
    result.talkingPoints.forEach((pt, i) => {
      y = guardPage(doc, y, 12);
      doc.setFont("helvetica", "bold");
      setTxt(doc, C.accent);
      doc.text(`${i + 1}.`, MARGIN, y);
      doc.setFont("helvetica", "normal");
      setTxt(doc, C.text);
      y = drawWrapped(doc, pt, MARGIN + 7, y, CONTENT_W - 9);
      y += 3;
    });
    y += 5;
  }

  // ── FLAGS ────────────────────────────────────────────────────────────────
  if (result.flags?.length) {
    y = guardPage(doc, y, 20);
    const flagHeight = result.flags.reduce((acc, f) => {
      return acc + doc.splitTextToSize(f, CONTENT_W - 12).length * 5.5 + 4;
    }, 25);

    setFill(doc, C.cream);
    setDraw(doc, C.gold);
    doc.setLineWidth(0.5);
    doc.roundedRect(MARGIN - 3, y - 5, CONTENT_W + 6, flagHeight, 2, 2, "FD");

    y = sectionHeading(doc, "⚑  Address First — Your Rules", y);
    doc.setFontSize(9.5);
    result.flags.forEach((flag) => {
      y = guardPage(doc, y, 12);
      doc.setFont("helvetica", "normal");
      setTxt(doc, C.red);
      doc.text("●", MARGIN, y);
      setTxt(doc, C.text);
      y = drawWrapped(doc, flag, MARGIN + 6, y, CONTENT_W - 10);
      y += 3;
    });
  }

  // ── FOOTER ───────────────────────────────────────────────────────────────
  const totalPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    setFill(doc, C.navy);
    doc.rect(0, PAGE_H - 18, PAGE_W, 18, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    setTxt(doc, C.muted);
    doc.text(
      "F.A.S.T. output is a decision-support draft. Advisor review required before any client use.",
      PAGE_W / 2,
      PAGE_H - 10,
      { align: "center" }
    );
    setTxt(doc, C.gold);
    doc.text("Built by Vicron A.I. Consulting — Bridging the Gap", PAGE_W / 2, PAGE_H - 4, {
      align: "center",
    });
    if (totalPages > 1) {
      setTxt(doc, C.muted);
      doc.text(`${p} / ${totalPages}`, PAGE_W - MARGIN, PAGE_H - 10, { align: "right" });
    }
  }

  const clientName = result.clientSnapshot?.name?.replace(/[^a-zA-Z0-9]/g, "-") || "Client";
  const dateStr = new Date().toISOString().split("T")[0];
  doc.save(`FAST-${clientName}-${dateStr}.pdf`);
}
