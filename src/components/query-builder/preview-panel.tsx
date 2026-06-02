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
    <section className="work-panel animate-panel-in overflow-hidden" style={{ animationDelay: "0.08s" }}>
      <div className="panel-header flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div>
          <p className="section-kicker">Preview</p>
          <h2 className="mt-1 text-lg font-black text-ink">Generated query</h2>
        </div>
        <div className="inline-flex rounded-xl border border-white/20 bg-white/10 p-1 backdrop-blur-md">
          {formats.map((format) => {
            const Icon = format.icon;
            return (
              <button
                key={format.id}
                type="button"
                className={cn("inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-black transition duration-200", previewFormat === format.id ? "bg-accent text-white shadow-[0_8px_20px_rgb(var(--accent-deep)/0.35)]" : "text-inkSoft hover:bg-white/40 hover:text-ink")}
                onClick={() => setPreviewFormat(format.id)}
              >
                <Icon className="h-3.5 w-3.5" />
                {format.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-4">
        <div className="overflow-hidden rounded-2xl border border-accentSoft/25 shadow-[0_22px_50px_rgb(var(--accent-deep)/0.18)]">
          <div className="code-panel flex items-center gap-2 border-b border-white/10 px-3 py-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff6b6b]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#fbbf24]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#60a5fa]" />
            <span className="ml-2 inline-flex min-w-0 items-center gap-2 text-xs font-bold uppercase tracking-wide text-white/60">
              <Terminal className="h-3.5 w-3.5" />
              {previewFormat}
            </span>
            <button type="button" className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-md border border-white/10 bg-white/10 px-2.5 text-xs font-bold text-white/80 transition hover:bg-white/15" onClick={copyPreview}>
              {copied ? <ClipboardCheck className="h-3.5 w-3.5 text-accentGlow" /> : <Clipboard className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <pre className="code-panel max-h-[360px] overflow-auto p-4 text-xs leading-6">
            <code>{preview}</code>
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
