import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase";
import { formatDate } from "@/lib/utils";
import { Plus, Clock, Globe, Lock, Trash2, ExternalLink } from "lucide-react";
import { DeleteTestButton } from "@/components/test/DeleteTestButton";
import type { Test } from "@/types";

export default async function MyTestsPage() {
  const { userId } = auth();
  const supabase = createServiceClient();

  const { data: tests } = await supabase
    .from("tests")
    .select("*, questions(count)")
    .eq("clerk_user_id", userId!)
    .order("created_at", { ascending: false });

  const subjectColors: Record<string, string> = {
    physics: "text-blue-600 border-blue-600",
    chemistry: "text-green-600 border-green-600",
    mathematics: "text-red-600 border-red-600",
    mixed: "text-amber-600 border-amber-600",
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-10">
        <div>
          <p className="section-label mb-1">Manage</p>
          <h1 className="font-display text-4xl font-bold text-ink-900">My Tests</h1>
        </div>
        <div className="flex gap-3">
          <Link href="/upload" className="btn-neo-outline">Upload PDF</Link>
          <Link href="/tests/new" className="btn-neo-amber">
            <Plus size={16} /> New Test
          </Link>
        </div>
      </div>

      {tests && tests.length > 0 ? (
        <div className="border-2 border-ink-900 bg-white overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-ink-900 text-ink-50">
            <div className="col-span-4 text-xs font-mono uppercase tracking-widest">Title</div>
            <div className="col-span-2 text-xs font-mono uppercase tracking-widest">Subject</div>
            <div className="col-span-1 text-xs font-mono uppercase tracking-widest">Qs</div>
            <div className="col-span-2 text-xs font-mono uppercase tracking-widest">Duration</div>
            <div className="col-span-1 text-xs font-mono uppercase tracking-widest">Access</div>
            <div className="col-span-2 text-xs font-mono uppercase tracking-widest">Actions</div>
          </div>

          {(tests as Test[]).map((test, i) => (
            <div
              key={test.id}
              className={`grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-ink-50 transition-colors ${
                i < tests.length - 1 ? "border-b border-ink-100" : ""
              }`}
            >
              <div className="col-span-4 min-w-0">
                <Link
                  href={`/tests/${test.slug}`}
                  className="font-body font-medium text-sm text-ink-900 hover:text-amber-600 transition-colors truncate block"
                >
                  {test.title}
                </Link>
                <p className="text-xs text-ink-400 font-mono mt-0.5">
                  {formatDate(test.created_at)}
                </p>
              </div>
              <div className="col-span-2">
                <span className={`badge ${subjectColors[test.subject] || "text-ink-500 border-ink-300"}`}>
                  {test.subject}
                </span>
              </div>
              <div className="col-span-1 font-mono text-sm text-ink-600">
                {(test as any).questions?.[0]?.count ?? "—"}
              </div>
              <div className="col-span-2 flex items-center gap-1 font-mono text-sm text-ink-600">
                <Clock size={12} />
                {test.duration_mins}m
              </div>
              <div className="col-span-1">
                {test.is_public ? (
                  <Globe size={14} className="text-emerald-500" />
                ) : (
                  <Lock size={14} className="text-ink-400" />
                )}
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <Link
                  href={`/tests/${test.slug}`}
                  className="p-1.5 border border-ink-200 hover:border-ink-900 hover:bg-ink-50 transition-all"
                  title="View test"
                >
                  <ExternalLink size={13} />
                </Link>
                <DeleteTestButton testId={test.id} testTitle={test.title} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="border-2 border-ink-900 bg-white px-8 py-24 text-center">
          <div className="font-display text-6xl mb-4">📄</div>
          <h3 className="font-display text-2xl font-bold text-ink-900 mb-2">No tests yet</h3>
          <p className="text-ink-500 text-sm mb-6">
            Upload a PDF to extract a prompt, then import the AI-generated questions.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/upload" className="btn-neo-outline">Upload PDF</Link>
            <Link href="/tests/new" className="btn-neo-amber">Create Manually</Link>
          </div>
        </div>
      )}
    </div>
  );
}
