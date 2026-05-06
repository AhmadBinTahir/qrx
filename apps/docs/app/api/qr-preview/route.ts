import { NextRequest, NextResponse } from "next/server";
import { generateQR } from "qrx";
import type { GenerateQROptions } from "qrx";

export async function GET(req: NextRequest) {
  try {
    const payload = req.nextUrl.searchParams.get("payload");
    if (!payload) throw new Error("Missing payload query");
    const parsed = JSON.parse(payload) as GenerateQROptions;
    const result = await generateQR(parsed);
    return new NextResponse(result.svg ?? "", {
      status: 200,
      headers: { "content-type": "image/svg+xml; charset=utf-8" }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to preview" },
      { status: 400 }
    );
  }
}
