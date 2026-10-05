import { NextRequest } from "next/server";
import {
  GET as qualitativeGET,
  POST as qualitativePOST,
} from "../route";
import { POST as materialPOST } from "../materials/route";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const GET = qualitativeGET;

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const operation = String(body?.operation ?? "").trim();

  const mappedOperation =
    operation === "create_source"
      ? "create_material"
      : operation === "update_source"
        ? "update_material"
        : "";

  const forwarded = new NextRequest(request.url, {
    method: "POST",
    headers: request.headers,
    body: JSON.stringify(
      mappedOperation
        ? {
            ...body,
            operation: mappedOperation,
          }
        : body,
    ),
  });

  if (mappedOperation) {
    return materialPOST(forwarded);
  }

  return qualitativePOST(forwarded);
}
