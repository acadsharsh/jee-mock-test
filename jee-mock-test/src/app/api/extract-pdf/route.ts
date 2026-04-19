import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { buildExtractionPrompt } from "@/lib/utils";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await req.formData();
    const pdfFile = formData.get("pdf") as File | null;
    const subject = (formData.get("subject") as string) || "physics";
    const difficulty = (formData.get("difficulty") as string) || "medium";
    const questionCount = parseInt((formData.get("questionCount") as string) || "30", 10);

    if (!pdfFile) return NextResponse.json({ error: "No PDF provided" }, { status: 400 });
    if (pdfFile.type !== "application/pdf") return NextResponse.json({ error: "File must be a PDF" }, { status: 400 });
    if (pdfFile.size > 20 * 1024 * 1024) return NextResponse.json({ error: "PDF too large (max 20 MB)" }, { status: 400 });

    // Convert File to Buffer
    const arrayBuffer = await pdfFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Dynamically import pdf-parse (server-only)
    const pdfParse = (await import("pdf-parse")).default;
    const pdfData = await pdfParse(buffer);
    const extractedText = pdfData.text?.trim();

    if (!extractedText || extractedText.length < 100) {
      return NextResponse.json({ error: "Could not extract meaningful text from this PDF. Try a text-based PDF (not a scanned image)." }, { status: 422 });
    }

    const prompt = buildExtractionPrompt(extractedText, { subject, difficulty, questionCount });

    return NextResponse.json({
      prompt,
      charCount: extractedText.length,
      pages: pdfData.numpages,
    });
  } catch (err: any) {
    console.error("[extract-pdf]", err);
    return NextResponse.json({ error: err.message || "Extraction failed" }, { status: 500 });
  }
}
