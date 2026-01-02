import { NextRequest, NextResponse } from "next/server";
import { extractText } from "unpdf";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const fileName = file.name.toLowerCase();
    let content = "";

    if (fileName.endsWith(".pdf")) {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const result = await extractText(uint8Array, { mergePages: true });
      content = result.text;
    } else if (
      fileName.endsWith(".txt") ||
      fileName.endsWith(".md") ||
      fileName.endsWith(".markdown")
    ) {
      content = await file.text();
    } else if (fileName.endsWith(".doc") || fileName.endsWith(".docx")) {
      content = await file.text();
    } else {
      return NextResponse.json(
        { error: "Unsupported file format" },
        { status: 400 }
      );
    }

    content = content
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 50000);

    return NextResponse.json({ content, fileName: file.name });
  } catch (error) {
    console.error("Document processing error:", error);
    return NextResponse.json(
      { error: "Failed to process document" },
      { status: 500 }
    );
  }
}
