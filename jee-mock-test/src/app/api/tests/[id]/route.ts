import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServiceClient } from "@/lib/supabase";

// GET /api/tests/[id] — get test with questions
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { userId } = auth();
  const supabase = createServiceClient();

  const { data: test, error } = await supabase
    .from("tests")
    .select("*, questions(*)")
    .eq("id", params.id)
    .single();

  if (error || !test) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Must be owner or public
  if (!test.is_public && test.clerk_user_id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Sort questions
  if (test.questions) {
    test.questions.sort((a: any, b: any) => a.question_number - b.question_number);
  }

  return NextResponse.json(test);
}

// PATCH /api/tests/[id] — update test metadata
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServiceClient();
  const body = await req.json();

  // Verify ownership
  const { data: existing } = await supabase
    .from("tests")
    .select("clerk_user_id")
    .eq("id", params.id)
    .single();

  if (!existing || existing.clerk_user_id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const allowed = ["title", "description", "is_public", "duration_mins", "difficulty"];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  const { data, error } = await supabase
    .from("tests")
    .update(updates)
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE /api/tests/[id] — delete test (cascades to questions/attempts)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServiceClient();

  const { data: existing } = await supabase
    .from("tests")
    .select("clerk_user_id")
    .eq("id", params.id)
    .single();

  if (!existing || existing.clerk_user_id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabase.from("tests").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
