import { readFile } from "fs/promises";
import { type NextRequest, NextResponse } from "next/server";
import { join } from "path";

/**
 * GET /api/hanzi-data/[char]
 *
 * Returns the hanzi-writer-data JSON for a single Chinese character, read
 * directly from the installed npm package at build time so no external network
 * call is needed at runtime.
 *
 * The response is served with a one-year immutable cache header — the data is
 * static and versioned with the package, so it never needs revalidation.
 *
 * @param params.char - A single Unicode codepoint (Chinese character). Returns
 *   400 if the segment is empty or more than one character, 404 if the
 *   character has no stroke data in hanzi-writer-data.
 */
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
