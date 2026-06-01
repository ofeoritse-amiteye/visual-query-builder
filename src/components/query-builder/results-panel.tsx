"use client";

import { Play, SearchX } from "lucide-react";
import { useMemo, useState } from "react";
import { useQueryStore } from "@/lib/query/store";
import type { DataRecord, SchemaDefinition } from "@/lib/query/types";

type ResultsPanelProps = {
  schema: SchemaDefinition;
  results: DataRecord[];
  canExecute: boolean;
  onExecute: () => void;
};

const ROW_HEIGHT = 40;
const VIRTUAL_VIEWPORT_HEIGHT = 320;
const VIRTUAL_THRESHOLD = 12;
const PAGE_SIZE_OPTIONS = [5, 25, 50] as const;

export function ResultsPanel({ schema, results, canExecute, onExecute }: ResultsPanelProps) {
  const execution = useQueryStore((state) => state.execution);
  const setExecution = useQueryStore((state) => state.setExecution);
  const [scrollTop, setScrollTop] = useState(0);

  const sortedResults = useMemo(() => {
    return [...results].sort((left, right) => {
      const leftValue = left[execution.sortField];
      const rightValue = right[execution.sortField];
      const comparison = String(leftValue ?? "").localeCompare(String(rightValue ?? ""), undefined, { numeric: true });
      return execution.sortDirection === "asc" ? comparison : -comparison;
    });
  }, [execution.sortDirection, execution.sortField, results]);

  const totalPages = Math.max(1, Math.ceil(sortedResults.length / execution.pageSize));
  const currentPage = Math.min(execution.page, totalPages);
  const pageResults = sortedResults.slice((currentPage - 1) * execution.pageSize, currentPage * execution.pageSize);
  const useVirtualRows = pageResults.length >= VIRTUAL_THRESHOLD;
  const visibleCount = Math.ceil(VIRTUAL_VIEWPORT_HEIGHT / ROW_HEIGHT) + 2;
  const startIndex = useVirtualRows ? Math.max(0, Math.floor(scrollTop / ROW_HEIGHT)) : 0;
  const endIndex = useVirtualRows ? Math.min(pageResults.length, startIndex + visibleCount) : pageResults.length;
  const visibleRows = pageResults.slice(startIndex, endIndex);
  const topSpacerHeight = useVirtualRows ? startIndex * ROW_HEIGHT : 0;
  const bottomSpacerHeight = useVirtualRows ? Math.max(0, (pageResults.length - endIndex) * ROW_HEIGHT) : 0;
  const tableBodyHeight = useVirtualRows ? VIRTUAL_VIEWPORT_HEIGHT : undefined;

  return (
    <section className="rounded-md border border-border bg-panel p-4 shadow-soft animate-fade-in">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/60">Results</h2>
        <span className="rounded-md border border-border bg-muted px-2.5 py-1 text-xs text-ink/70">{results.length} matches</span>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <select className="h-9 rounded-md border border-border bg-panel px-3 text-sm" value={execution.pageSize} onChange={(event) => setExecution({ pageSize: Number(event.target.value), page: 1 })}>
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size} / page
              </option>
            ))}
          </select>
          <select className="h-9 rounded-md border border-border bg-panel px-3 text-sm" value={execution.sortField} onChange={(event) => setExecution({ sortField: event.target.value, page: 1 })}>
            {schema.fields.map((field) => (
              <option key={field.key} value={field.key}>
                {field.label}
              </option>
            ))}
          </select>
          <button type="button" className="h-9 rounded-md border border-border bg-panel px-3 text-sm transition hover:bg-muted" onClick={() => setExecution({ sortDirection: execution.sortDirection === "asc" ? "desc" : "asc" })}>
            {execution.sortDirection.toUpperCase()}
          </button>
          <button
            type="button"
            className="inline-flex h-9 items-center gap-2 rounded-md border border-accent bg-accent px-3 text-sm font-semibold text-slate-950 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!canExecute || execution.loading}
            onClick={onExecute}
          >
            <Play className="h-4 w-4" />
            {execution.loading ? "Running" : "Run"}
          </button>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-md border border-border">
        {execution.loading ? (
          <div className="grid h-44 place-items-center text-sm text-ink/60 animate-pulse-soft">Running query...</div>
        ) : pageResults.length === 0 ? (
          <div className="grid h-44 place-items-center gap-2 text-center text-sm text-ink/60 animate-fade-in">
            <SearchX className="mx-auto h-7 w-7" />
            No matching records
          </div>
        ) : (
          <div className={useVirtualRows ? "overflow-y-auto" : undefined} style={useVirtualRows ? { maxHeight: tableBodyHeight } : undefined} onScroll={useVirtualRows ? (event) => setScrollTop(event.currentTarget.scrollTop) : undefined}>
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead className="sticky top-0 z-10 bg-muted text-xs uppercase text-ink/55">
                <tr>
                  {schema.fields.map((field) => (
                    <th key={field.key} className="border-b border-border px-3 py-2 font-semibold">
                      {field.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {useVirtualRows && topSpacerHeight > 0 && (
                  <tr aria-hidden="true">
                    <td colSpan={schema.fields.length} style={{ height: topSpacerHeight, padding: 0, border: 0 }} />
                  </tr>
                )}
                {visibleRows.map((record, rowIndex) => (
                  <tr key={`${record[schema.fields[0].key]}-${startIndex + rowIndex}`} className="border-b border-border transition-colors last:border-0 hover:bg-muted/40" style={useVirtualRows ? { height: ROW_HEIGHT } : undefined}>
                    {schema.fields.map((field) => (
                      <td key={field.key} className="px-3 py-2 text-ink/80">
                        {String(record[field.key] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
                {useVirtualRows && bottomSpacerHeight > 0 && (
                  <tr aria-hidden="true">
                    <td colSpan={schema.fields.length} style={{ height: bottomSpacerHeight, padding: 0, border: 0 }} />
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 text-sm text-ink/60">
        <button type="button" className="rounded-md border border-border bg-panel px-3 py-1.5 transition hover:bg-muted disabled:opacity-40" disabled={currentPage <= 1} onClick={() => setExecution({ page: currentPage - 1 })}>
          Previous
        </button>
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <button type="button" className="rounded-md border border-border bg-panel px-3 py-1.5 transition hover:bg-muted disabled:opacity-40" disabled={currentPage >= totalPages} onClick={() => setExecution({ page: currentPage + 1 })}>
          Next
        </button>
      </div>
    </section>
  );
}
