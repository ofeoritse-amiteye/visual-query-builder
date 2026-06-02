"use client";

import { ArrowDownAZ, ArrowUpAZ, ChevronLeft, ChevronRight, Database, Gauge, Loader2, Play, SearchX } from "lucide-react";
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
  const matchRate = schema.dataset.length === 0 ? 0 : Math.round((results.length / schema.dataset.length) * 100);

  return (
    <section className="work-panel animate-panel-in overflow-hidden" style={{ animationDelay: "0.12s" }}>
      <div className="panel-header flex flex-wrap items-center gap-3 px-4 py-3 md:px-5">
        <div>
          <p className="section-kicker">Results</p>
          <h2 className="mt-1 text-lg font-black text-ink">Execution table</h2>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <span className="soft-chip" data-tone="accent">
            <Database className="h-3.5 w-3.5" />
            {results.length} matches
          </span>
          <span className="soft-chip">
            <Gauge className="h-3.5 w-3.5" />
            {matchRate}% of data
          </span>
        </div>
      </div>

      <div className="p-4 md:p-5">
        <div className="flex flex-wrap items-center gap-3">
          <select className="field-control min-w-[5.5rem] text-sm" value={execution.pageSize} onChange={(event) => setExecution({ pageSize: Number(event.target.value), page: 1 })}>
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size} / page
              </option>
            ))}
          </select>
          <select className="field-control min-w-[10rem] text-sm" value={execution.sortField} onChange={(event) => setExecution({ sortField: event.target.value, page: 1 })}>
            {schema.fields.map((field) => (
              <option key={field.key} value={field.key}>
                {field.label}
              </option>
            ))}
          </select>
          <button type="button" className="action-button action-button-secondary text-sm" onClick={() => setExecution({ sortDirection: execution.sortDirection === "asc" ? "desc" : "asc" })}>
            {execution.sortDirection === "asc" ? <ArrowDownAZ className="h-4 w-4" /> : <ArrowUpAZ className="h-4 w-4" />}
            {execution.sortDirection.toUpperCase()}
          </button>
          <button
            type="button"
            className="action-button action-button-primary ml-auto text-sm"
            disabled={!canExecute || execution.loading}
            onClick={onExecute}
          >
            <Play className="h-4 w-4" />
            {execution.loading ? "Running" : "Run"}
          </button>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-white/30 bg-panel/40 shadow-[inset_0_1px_0_rgb(var(--glass-highlight)/0.35)] backdrop-blur-md">
          {execution.loading ? (
            <div className="grid h-52 place-items-center gap-2 text-center text-sm font-semibold text-inkSoft">
              <Loader2 className="h-8 w-8 animate-spin text-accent" aria-hidden="true" />
              Running query...
            </div>
          ) : pageResults.length === 0 ? (
            <div className="grid h-52 place-items-center gap-2 text-center text-sm font-semibold text-inkSoft animate-fade-in">
              <div>
                <SearchX className="mx-auto mb-2 h-8 w-8 text-warn" />
                No matching records
              </div>
            </div>
          ) : (
            <div className={useVirtualRows ? "overflow-y-auto" : undefined} style={useVirtualRows ? { maxHeight: tableBodyHeight } : undefined} onScroll={useVirtualRows ? (event) => setScrollTop(event.currentTarget.scrollTop) : undefined}>
              <table className="w-full min-w-[680px] border-collapse text-left text-sm">
                <thead className="sticky top-0 z-10 bg-muted/95 text-xs uppercase text-inkSoft backdrop-blur">
                  <tr>
                    {schema.fields.map((field) => (
                      <th key={field.key} className="border-b border-border/80 px-3 py-3 font-black">
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
                    <tr
                      key={`${record[schema.fields[0].key]}-${startIndex + rowIndex}`}
                      className="result-row border-b border-border/70 transition-colors last:border-0 hover:bg-accent/10"
                      style={{ ...(useVirtualRows ? { height: ROW_HEIGHT } : {}), animationDelay: `${rowIndex * 22}ms` }}
                    >
                      {schema.fields.map((field) => (
                        <td key={field.key} className="px-3 py-2.5 font-medium text-ink/80">
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

        <div className="mt-3 flex items-center justify-between gap-3 text-sm font-semibold text-inkSoft">
          <button type="button" className="action-button action-button-secondary px-3 text-sm disabled:opacity-40" disabled={currentPage <= 1} onClick={() => setExecution({ page: currentPage - 1 })}>
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>
          <span className="rounded-full bg-muted/70 px-3 py-1.5">
            Page {currentPage} of {totalPages}
          </span>
          <button type="button" className="action-button action-button-secondary px-3 text-sm disabled:opacity-40" disabled={currentPage >= totalPages} onClick={() => setExecution({ page: currentPage + 1 })}>
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
