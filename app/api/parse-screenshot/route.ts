import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseScreenshot } from "@/lib/parse-screenshot";

const ALLOWED = ["image/png", "image/jpeg", "image/webp", "image/gif"] as const;
type AllowedType = (typeof ALLOWED)[number];

export const maxDuration = 60;

/** Accepts an uploaded screenshot, returns parsed expense rows for review. */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No image uploaded." }, { status: 400 });
  }
  if (!ALLOWED.includes(file.type as AllowedType)) {
    return NextResponse.json({ error: "Unsupported image type." }, { status: 400 });
  }

  const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");

  try {
    const rows = await parseScreenshot(base64, file.type as AllowedType);
    return NextResponse.json({ rows });
  } catch {
    return NextResponse.json(
      { error: "Could not read that screenshot. Try a clearer image or add it manually." },
      { status: 502 }
    );
  }
}
