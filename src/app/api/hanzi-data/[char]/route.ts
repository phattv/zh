import { readFile } from "fs/promises";
import { join } from "path";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ char: string }> },
) {
  const { char } = await params;

  // Only single characters are valid
  if (!char || [...char].length !== 1) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  try {
    const file = join(
      process.cwd(),
      "node_modules/hanzi-writer-data",
      `${char}.json`,
    );
    const content = await readFile(file, "utf-8");
    return new NextResponse(content, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
}
