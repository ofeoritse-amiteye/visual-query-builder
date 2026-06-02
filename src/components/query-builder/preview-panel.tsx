"use client";

import { AlertCircle, Braces, CheckCircle2, Clipboard, ClipboardCheck, Database, FileJson, Terminal } from "lucide-react";
import { useState } from "react";
import { generateGraphql, generateMongo, generateSql } from "@/lib/query/generate";
import { useQueryStore } from "@/lib/query/store";
import type { PreviewFormat, QueryTree, SchemaDefinition, ValidationIssue } from "@/lib/query/types";
import { cn } from "@/lib/utils";

type PreviewPanelProps = {
  tree: QueryTree;
  schema: SchemaDefinition;
  issues: ValidationIssue[];
};

const formats: Array<{ id: PreviewFormat; label: string; icon: typeof Database }> = [
  { id: "sql", label: "SQL", icon: Database },
  { id: "mongo", label: "Mongo", icon: FileJson },
  { id: "graphql", label: "GraphQL", icon: Braces }
];

export function PreviewPanel({ tree, schema, issues }: PreviewPanelProps) {
  const previewFormat = useQueryStore((state) => state.previewFormat);
  const setPreviewFormat = useQueryStore((state) => state.setPreviewFormat);
  const [copied, setCopied] = useState(false);
  const preview = previewFormat === "sql" ? generateSql(tree, schema) : previewFormat === "mongo" ? generateMongo(tree, schema) : generateGraphql(tree, schema);
  const errors = issues.filter((issue) => issue.severity === "error");

  function copyPreview() {
    void navigator.clipboard.writeText(preview).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    });
  }

  return (
    <section className="work-panel animate-panel-in min-w-0 max-w-full" style={{ animationDelay: "0.08s" }}>
      <div className="panel-header flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="section-kicker">Preview</p>
        </div>
        <div className="inline-flex max-w-full overflow-x-auto rounded-xl border border-white/20 bg-white/10 p-1 backdrop-blur-md">
          {formats.map((format) => {
            const Icon = format.icon;
            return (
              <button
                key={format.id}
                type="button"
                className={cn("inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-xs font-black transition duration-200", previewFormat === format.id ? "bg-accent text-white shadow-[0_8px_20px_rgb(var(--accent-deep)/0.35)]" : "text-inkSoft hover:bg-white/40 hover:text-ink")}
                onClick={() => setPreviewFormat(format.id)}
              >
                <Icon className="h-3.5 w-3.5" />
                {format.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="min-w-0 p-4">
        <div className="min-w-0 overflow-hidden rounded-2xl border border-accentSoft/25 shadow-[0_22px_50px_rgb(var(--accent-deep)/0.18)]">
          <div className="code-panel flex flex-wrap items-center gap-2 border-b border-white/10 px-3 py-2.5">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#ff6b6b]" />
            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#fbbf24]" />
            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#60a5fa]" />
            <span className="inline-flex min-w-0 items-center gap-2 text-xs font-bold uppercase tracking-wide text-white/60">
              <Terminal className="h-3.5 w-3.5 shrink-0" />
              {previewFormat}
            </span>
            <button type="button" className="ml-auto inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-white/10 bg-white/10 px-2.5 text-xs font-bold text-white/80 transition hover:bg-white/15" onClick={copyPreview}>
              {copied ? <ClipboardCheck className="h-3.5 w-3.5 text-accentGlow" /> : <Clipboard className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <pre className="code-panel max-h-[360px] overflow-x-auto overflow-y-auto p-4 text-xs leading-6">
            <code className="block min-w-0 whitespace-pre-wrap break-words sm:whitespace-pre">{preview}</code>
          </pre>
        </div>

        <div className="mt-4 space-y-2">
          {errors.length === 0 ? (
            <p className="flex items-center gap-2 rounded-lg border border-success/25 bg-success/10 px-3 py-2 text-sm font-semibold text-success">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Query is valid
            </p>
          ) : (
            errors.slice(0, 4).map((issue) => (
              <p key={`${issue.nodeId}-${issue.message}`} className="flex gap-2 rounded-lg border border-warn/25 bg-warn/10 px-3 py-2 text-sm font-medium text-warn">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {issue.message}
              </p>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
