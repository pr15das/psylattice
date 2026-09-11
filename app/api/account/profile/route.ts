import { NextRequest, NextResponse } from "next/server";
import { authenticatedBillingUser } from "@/lib/billing/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const AFFILIATION_TYPES = new Set([
  "institution",
  "independent",
  "organisation",
  "other",
  "prefer_not_to_say",
]);

const DESIGNATIONS = new Set([
  "undergraduate_student",
  "masters_student",
  "phd_scholar",
  "research_assistant",
  "postdoctoral_researcher",
  "lecturer_assistant_professor",
  "associate_professor",
  "professor",
  "independent_researcher",
  "industry_researcher",
  "clinician_practitioner",
  "other",
]);

const STUDENT_LEVELS = new Set([
  "undergraduate",
  "masters",
  "doctoral",
  "other",
]);

function optionalText(value: unknown, max = 160) {
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (!text) return null;
  return text.slice(0, max);
}

function optionalEnum(value: unknown, values: Set<string>) {
  const text = optionalText(value, 80);
  if (!text) return null;
  if (!values.has(text)) throw new Error("One of the selected profile options is invalid.");
  return text;
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await authenticatedBillingUser();
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Please sign in again." },
        { status: 401 },
      );
    }

    const body = (await request.json()) as Record<string, unknown>;
    const fullName = optionalText(body.full_name, 120);
    if (!fullName) {
      return NextResponse.json(
        { ok: false, error: "Your name cannot be empty." },
        { status: 400 },
      );
    }

    let age: number | null = null;
    if (body.age !== null && body.age !== undefined && body.age !== "") {
      age = Number(body.age);
      if (!Number.isInteger(age) || age < 13 || age > 120) {
        return NextResponse.json(
          { ok: false, error: "Enter a valid age between 13 and 120, or leave it blank." },
          { status: 400 },
        );
      }
    }

    const affiliationType = optionalEnum(body.affiliation_type, AFFILIATION_TYPES);
    const designation = optionalEnum(body.designation, DESIGNATIONS);
    const studentLevel = optionalEnum(body.student_level, STUDENT_LEVELS);

    const patch = {
      full_name: fullName,
      age,
      gender: optionalText(body.gender, 80),
      affiliation_type: affiliationType,
      institution_name: optionalText(body.institution_name, 180),
      department: optionalText(body.department, 180),
      designation,
      student_level:
        designation === "undergraduate_student" ||
        designation === "masters_student" ||
        designation === "phd_scholar"
          ? studentLevel
          : null,
      primary_field: optionalText(body.primary_field, 160),
      country: optionalText(body.country, 120),
      profile_completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("profiles")
      .update(patch)
      .eq("id", user.id)
      .select(
        "id, full_name, age, gender, affiliation_type, institution_name, department, designation, student_level, primary_field, country, workspace_access, created_at, updated_at, profile_completed_at",
      )
      .single();

    if (error) throw error;

    // Keep auth metadata aligned with the canonical profile name.
    const { error: metadataError } = await supabase.auth.updateUser({
      data: { full_name: fullName },
    });
    if (metadataError) {
      console.warn("Profile saved but auth display name was not updated:", metadataError);
    }

    return NextResponse.json(
      { ok: true, profile: data },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("Account profile update failed:", error);
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "PsyLattice could not update your profile.",
      },
      { status: 500 },
    );
  }
}
