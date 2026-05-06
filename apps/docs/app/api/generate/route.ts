import { NextRequest, NextResponse } from "next/server";
import { generateQR } from "qrx";
import type { QRType } from "qrx";

export async function GET(req: NextRequest) {
  try {
    const type = (req.nextUrl.searchParams.get("type") ?? "url") as QRType;
    const dataRaw = req.nextUrl.searchParams.get("data") ?? "{\"url\":\"https://example.com\"}";
    const theme = req.nextUrl.searchParams.get("theme") ?? "neon";
    const data = JSON.parse(dataRaw);
    const result = await generateQR({
      type,
      data,
      style: { theme: theme as "neon" | "minimal" | "corporate" | "classic" },
      format: "svg"
    });
    return new NextResponse(result.svg ?? "", {
      status: 200,
      headers: {
        "content-type": "image/svg+xml; charset=utf-8",
        "x-qrx-score": String(result.score)
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate" },
      { status: 400 }
    );
  }
}
