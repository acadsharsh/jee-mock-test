import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServiceClient } from "@/lib/supabase";
import { generateSlug } from "@/lib/utils";
import type { CreateTestPayload } from "@/types";

// GET /api/tests — list user's tests
export async function GET(req: NextRequest) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("tests")
    .select("*, questions(count)")
    .eq("clerk_user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/tests — create test + questions
export async function POST(req: NextRequest) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body: CreateTestPayload = await req.json();
    const { questions, ...testData } = body;

    if (!testData.title?.trim()) return NextResponse.json({ error: "Title is required" }, { status: 400 });
    if (!questions?.length) return NextResponse.json({ error: "At least one question is required" }, { status: 400 });

    const supabase = createServiceClient();
    const slug = generateSlug(testData.title);
    const totalMarks = questions.reduce((s, q) => s + q.marks_correct, 0);

    // Insert test
    const { data: test, error: testErr } = await supabase
      .from("tests")
      .insert({
        ...testData,
        clerk_user_id: userId,
        slug,
        total_marks: totalMarks,
      })
      .select()
      .single();

    if (testErr) throw new Error(testErr.message);

    // Insert questions in bulk
    const questionRows = questions.map((q, i) => ({
      test_id: test.id,
      question_number: q.question_number ?? i + 1,
      question_text: q.question_text,
      question_type: q.question_type,
      options: q.options ?? null,
      correct_answer: q.correct_answer,
      explanation: q.explanation ?? null,
      marks_correct: q.marks_correct,
      marks_incorrect: q.marks_incorrect,
      topic: q.topic ?? null,
      subtopic: q.subtopic ?? null,
      diagram_url: null,
    }));

    const { error: qErr } = await supabase.from("questions").insert(questionRows);
    if (qErr) throw new Error(qErr.message);

    return NextResponse.json({ test }, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/tests]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
