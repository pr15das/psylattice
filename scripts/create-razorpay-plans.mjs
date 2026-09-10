#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return;
  const text = fs.readFileSync(file, "utf8");
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const equals = line.indexOf("=");
    if (equals <= 0) continue;
    const key = line.slice(0, equals).trim();
    let value = line.slice(equals + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvFile(path.resolve(process.cwd(), ".env.local"));

const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;
if (!keyId || !keySecret) {
  console.error("Missing NEXT_PUBLIC_RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET.");
  process.exit(1);
}

const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

async function createPlan({ name, description, amount, period }) {
  const response = await fetch("https://api.razorpay.com/v1/plans", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      period,
      interval: 1,
      item: {
        name,
        description,
        amount,
        currency: "INR",
      },
      notes: {
        psylattice_product: name,
      },
    }),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error?.description || payload?.error?.code || "Razorpay plan creation failed.");
  }
  return payload;
}

try {
  const monthly = await createPlan({
    name: "PsyLattice Pro Monthly",
    description: "Researcher Pro Monthly subscription",
    amount: 74_900,
    period: "monthly",
  });

  const annual = await createPlan({
    name: "PsyLattice Pro Annual",
    description: "Researcher Pro Annual subscription",
    amount: 749_900,
    period: "yearly",
  });

  console.log("\nCreated Razorpay subscription plans. Add these to .env.local and Vercel:\n");
  console.log(`RAZORPAY_PRO_MONTHLY_PLAN_ID=${monthly.id}`);
  console.log(`RAZORPAY_PRO_ANNUAL_PLAN_ID=${annual.id}`);
  console.log("\nDo not run this script repeatedly unless you intentionally want duplicate Razorpay plans.\n");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
