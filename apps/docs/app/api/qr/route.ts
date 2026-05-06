import { NextRequest, NextResponse } from "next/server";
import { generateQR } from "qrx";
import type { GenerateQROptions } from "qrx";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as GenerateQROptions;
    const result = await generateQR(body);
    return NextResponse.json({
      svg: result.svg ?? "",
      score: result.score,
      warnings: result.warnings,
      payload: result.payload,
      matrixSize: result.matrixSize,
      version: result.version
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate QR" },
      { status: 400 }
    );
  }
}
