"use client";

import { studentTTwoSidedP } from "@/lib/research/cognitiveAnalysis";

export type AssociationMethod = "pearson" | "spearman";

export type AssociationPoint = {
  x: number;
  y: number;
  rowIndex: number;
};

export type AssociationResult = {
  method: AssociationMethod;
  n: number;
  missingPairs: number;
  coefficient: number | null;
  pTwoSided: number | null;
  df: number | null;
  ci95: [number, number] | null;
  points: AssociationPoint[];
};

function numeric(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function mean(values: number[]) {
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function pearsonFromPairs(pairs: AssociationPoint[]) {
  if (pairs.length < 2) return null;
  const xs = pairs.map((item) => item.x);
  const ys = pairs.map((item) => item.y);
  const mx = mean(xs);
  const my = mean(ys);
  if (mx === null || my === null) return null;

  let cross = 0;
  let x2 = 0;
  let y2 = 0;
  for (let index = 0; index < pairs.length; index += 1) {
    const dx = xs[index] - mx;
    const dy = ys[index] - my;
    cross += dx * dy;
    x2 += dx * dx;
    y2 += dy * dy;
  }
  const denom = Math.sqrt(x2 * y2);
  if (!Number.isFinite(denom) || denom === 0) return null;
  return Math.max(-1, Math.min(1, cross / denom));
}

function rank(values: number[]) {
  const indexed = values.map((value, index) => ({ value, index }));
  indexed.sort((a, b) => a.value - b.value);
  const ranks = Array(values.length).fill(0) as number[];

  let i = 0;
  while (i < indexed.length) {
    let j = i + 1;
    while (j < indexed.length && indexed[j].value === indexed[i].value) j += 1;
    const averageRank = ((i + 1) + j) / 2;
    for (let k = i; k < j; k += 1) {
      ranks[indexed[k].index] = averageRank;
    }
    i = j;
  }
  return ranks;
}

function spearmanFromPairs(pairs: AssociationPoint[]) {
  if (pairs.length < 2) return null;
  const rx = rank(pairs.map((item) => item.x));
  const ry = rank(pairs.map((item) => item.y));
  return pearsonFromPairs(
    pairs.map((item, index) => ({ ...item, x: rx[index], y: ry[index] }))
  );
}

function correlationP(r: number | null, n: number) {
  if (r === null || n < 3) return { p: null, df: n > 0 ? n - 2 : null };
  if (Math.abs(r) >= 1) return { p: 0, df: n - 2 };
  const df = n - 2;
  const denom = 1 - r * r;
  if (denom <= 0) return { p: 0, df };
  const t = r * Math.sqrt(df / denom);
  return { p: studentTTwoSidedP(t, df), df };
}

function fisherCi(r: number | null, n: number): [number, number] | null {
  if (r === null || n < 4 || Math.abs(r) >= 1) return null;
  const z = 0.5 * Math.log((1 + r) / (1 - r));
  const se = 1 / Math.sqrt(n - 3);
  const lowZ = z - 1.959963984540054 * se;
  const highZ = z + 1.959963984540054 * se;
  const back = (value: number) => {
    const exp = Math.exp(2 * value);
    return (exp - 1) / (exp + 1);
  };
  return [back(lowZ), back(highZ)];
}

export function buildAssociation(
  rows: Record<string, unknown>[],
  xVariable: string,
  yVariable: string,
  method: AssociationMethod
): AssociationResult {
  const points: AssociationPoint[] = [];
  let missingPairs = 0;

  rows.forEach((row, rowIndex) => {
    const x = numeric(row[xVariable]);
    const y = numeric(row[yVariable]);
    if (x === null || y === null) {
      missingPairs += 1;
      return;
    }
    points.push({ x, y, rowIndex });
  });

  const coefficient =
    method === "spearman"
      ? spearmanFromPairs(points)
      : pearsonFromPairs(points);

  const { p, df } = correlationP(coefficient, points.length);

  return {
    method,
    n: points.length,
    missingPairs,
    coefficient,
    pTwoSided: p,
    df,
    ci95: method === "pearson" ? fisherCi(coefficient, points.length) : null,
    points,
  };
}

export function numericAnalysisVariables(rows: Record<string, unknown>[]) {
  const blocked = new Set([
    "participant",
    "participant_code",
    "is_test",
    "status",
    "enrolled_at",
    "completed_at",
  ]);

  const columns = Array.from(
    new Set(rows.flatMap((row) => Object.keys(row)))
  );

  return columns
    .filter((column) => !blocked.has(column))
    .map((column) => {
      let valid = 0;
      let unique = new Set<number>();
      for (const row of rows) {
        const value = numeric(row[column]);
        if (value === null) continue;
        valid += 1;
        unique.add(value);
      }
      return { column, valid, unique: unique.size };
    })
    .filter((item) => item.valid >= 3 && item.unique >= 2)
    .sort((a, b) => a.column.localeCompare(b.column));
}
