import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServiceClient } from "@/lib/supabase";

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { userId } = auth();
  const supabase = createServiceClient();

  const { data: test, error } = await supabase
    .from("tests")
    .select("*, questions(*)")
    .eq("slug", params.slug)
    .single();

  if (error || !test) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!test.is_public && test.clerk_user_id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (test.questions) {
    test.questions.sort((a: any, b: any) => a.question_number - b.question_number);
  }

  return NextResponse.json(test);
}
