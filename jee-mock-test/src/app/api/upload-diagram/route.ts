import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServiceClient } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await req.formData();
    const imageFile = formData.get("image") as File | null;
    const questionId = formData.get("question_id") as string | null;

    if (!imageFile) return NextResponse.json({ error: "No image provided" }, { status: 400 });

    const allowedTypes = ["image/png", "image/jpeg", "image/webp"];
    if (!allowedTypes.includes(imageFile.type)) {
      return NextResponse.json({ error: "Only PNG, JPEG, WEBP allowed" }, { status: 400 });
    }

    if (imageFile.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Image too large (max 5 MB)" }, { status: 400 });
    }

    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const ext = imageFile.type.split("/")[1];
    const filename = `${userId}/${uuidv4()}.${ext}`;

    const supabase = createServiceClient();
    const { data, error } = await supabase.storage
      .from("diagrams")
      .upload(filename, buffer, {
        contentType: imageFile.type,
        upsert: false,
      });

    if (error) throw new Error(error.message);

    const { data: urlData } = supabase.storage.from("diagrams").getPublicUrl(data.path);

    // If question_id provided, update the question
    if (questionId) {
      await supabase
        .from("questions")
        .update({ diagram_url: urlData.publicUrl })
        .eq("id", questionId);
    }

    return NextResponse.json({ url: urlData.publicUrl, path: data.path });
  } catch (err: any) {
    console.error("[upload-diagram]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
