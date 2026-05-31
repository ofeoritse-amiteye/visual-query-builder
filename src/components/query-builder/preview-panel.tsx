"use client";

import { AlertCircle, Braces, Database, FileJson } from "lucide-react";
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
  const preview = previewFormat === "sql" ? generateSql(tree, schema) : previewFormat === "mongo" ? generateMongo(tree, schema) : generateGraphql(tree, schema);
  const errors = issues.filter((issue) => issue.severity === "error");

  return (
    <section className="rounded-md border border-border bg-panel p-4 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/60">Preview</h2>
        <div className="inline-flex rounded-md border border-border bg-muted p-1">
          {formats.map((format) => {
            const Icon = format.icon;
            return (
              <button
                key={format.id}
                type="button"
                className={cn("inline-flex h-8 items-center gap-1.5 rounded px-2.5 text-xs font-semibold transition", previewFormat === format.id ? "bg-panel text-ink shadow-sm" : "text-ink/60 hover:text-ink")}
                onClick={() => setPreviewFormat(format.id)}
              >
                <Icon className="h-3.5 w-3.5" />
                {format.label}
              </button>
            );
          })}
        </div>
      </div>
      <pre className="mt-4 max-h-[360px] overflow-auto rounded-md border border-border bg-slate-950 p-4 text-xs leading-6 text-slate-100">
        <code>{preview}</code>
      </pre>
      <div className="mt-4 space-y-2">
        {errors.length === 0 ? (
          <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100">Query is valid</p>
        ) : (
          errors.slice(0, 4).map((issue) => (
            <p key={`${issue.nodeId}-${issue.message}`} className="flex gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {issue.message}
            </p>
          ))
        )}
      </div>
    </section>
  );
}
