"use client";

import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Activity, Database, Layers3, ListChecks, Moon, Play, Plus, Rows3, ShieldCheck, Sun, Workflow } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { executeQuery } from "@/lib/query/execute";
import { SCHEMAS, getSchema } from "@/lib/query/schemas";
import { hydrateStoredSnapshots, useQueryStore } from "@/lib/query/store";
import { loadTheme, saveTheme } from "@/lib/query/storage";
import { validateTree } from "@/lib/query/validation";
import type { DataRecord, QueryTree, ValidationIssue } from "@/lib/query/types";
import { GroupNodeView } from "./group-node";
import { IconButton } from "./icon-button";
import { LibraryPanel } from "./library-panel";
import { PreviewPanel } from "./preview-panel";
import { ResultsPanel } from "./results-panel";

export function QueryBuilderApp() {
  const schemaId = useQueryStore((state) => state.schemaId);
  const tree = useQueryStore((state) => state.tree);
  const execution = useQueryStore((state) => state.execution);
  const selectSchema = useQueryStore((state) => state.selectSchema);
  const addRule = useQueryStore((state) => state.addRule);
  const addGroup = useQueryStore((state) => state.addGroup);
  const moveChild = useQueryStore((state) => state.moveChild);
  const savePreset = useQueryStore((state) => state.savePreset);
  const setExecution = useQueryStore((state) => state.setExecution);
  const historyCount = useQueryStore((state) => state.history.length);
  const presetCount = useQueryStore((state) => state.presets.length);
  const [results, setResults] = useState<DataRecord[]>([]);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const schema = getSchema(schemaId);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const issues = useMemo(() => validateTree(tree, schema), [schema, tree]);
  const issuesByNode = useMemo(() => groupIssuesByNode(issues), [issues]);
  const canExecute = issues.every((issue) => issue.severity !== "error");
  const treeMetrics = useMemo(() => getTreeMetrics(tree), [tree]);

  const runQuery = useCallback(() => {
    if (!canExecute || execution.loading) {
      return;
    }

    setExecution({ loading: true });
    window.setTimeout(() => {
      const nextResults = executeQuery(useQueryStore.getState().tree, getSchema(useQueryStore.getState().schemaId));
      setResults(nextResults);
      useQueryStore.getState().pushHistory("Executed query");
      useQueryStore.getState().setExecution({ loading: false, page: 1 });
    }, 350);
  }, [canExecute, execution.loading, setExecution]);

  useEffect(() => {
    hydrateStoredSnapshots();
    const storedTheme = loadTheme();
    setTheme(storedTheme);
    document.documentElement.classList.toggle("dark", storedTheme === "dark");
  }, []);

  useEffect(() => {
    if (!execution.loading) {
      setResults(executeQuery(tree, schema));
    }
  }, [execution.loading, schema, tree]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    saveTheme(theme);
  }, [theme]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const isTyping = ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);

      if (event.ctrlKey && event.key === "Enter" && !event.shiftKey && !isTyping) {
        event.preventDefault();
        addRule(tree.rootId);
      }

      if (event.ctrlKey && event.shiftKey && event.key === "Enter" && !isTyping) {
        event.preventDefault();
        addGroup(tree.rootId);
      }

      if (event.ctrlKey && event.key.toLowerCase() === "r") {
        event.preventDefault();
        runQuery();
      }

      if (event.ctrlKey && event.key.toLowerCase() === "s") {
        event.preventDefault();
        savePreset();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [addGroup, addRule, runQuery, savePreset, tree.rootId]);

  function onDragEnd(event: DragEndEvent) {
    const activeParent = event.active.data.current?.parentId;
    const overParent = event.over?.data.current?.parentId;
    if (event.over && activeParent && activeParent === overParent) {
      moveChild(activeParent, String(event.active.id), String(event.over.id));
    }
  }

  return (
    <main className="app-shell min-h-screen px-3 py-4 md:px-6 md:py-6 lg:px-8">
      <div className="mx-auto flex max-w-[1680px] flex-col gap-5">
        <header className="top-shell animate-panel-in overflow-visible p-4 md:p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 flex-wrap items-start gap-3">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-accentSoft/40 bg-accent/10 text-accent shadow-sm backdrop-blur-md">
                <Workflow className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="section-kicker">Recursive query studio</p>
                <h1 className="mt-1 text-2xl font-black leading-tight text-ink md:text-3xl">Visual Query Builder</h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-inkSoft">
                  Build nested logic, inspect generated queries, and execute against the {schema.label.toLowerCase()} dataset without losing sight of the structure.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select aria-label="Schema" className="field-control min-w-[11rem] text-sm font-semibold" value={schemaId} onChange={(event) => selectSchema(event.target.value)}>
                {SCHEMAS.map((candidate) => (
                  <option key={candidate.id} value={candidate.id}>
                    {candidate.label}
                  </option>
                ))}
              </select>
              <IconButton label="Add root condition" onClick={() => addRule(tree.rootId)}>
                <Plus className="h-4 w-4" />
              </IconButton>
              <IconButton label="Add root group" onClick={() => addGroup(tree.rootId)}>
                <Rows3 className="h-4 w-4" />
              </IconButton>
              <IconButton label="Run query" variant="solid" disabled={!canExecute || execution.loading} onClick={runQuery}>
                <Play className="h-4 w-4" />
              </IconButton>
              <IconButton label={theme === "dark" ? "Light mode" : "Dark mode"} onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}>
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </IconButton>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Rules" value={treeMetrics.rules} icon={ListChecks} />
            <Metric label="Groups" value={treeMetrics.groups} icon={Layers3} />
            <Metric label="Matches" value={`${results.length}/${schema.dataset.length}`} icon={Database} />
            <Metric label="Saved" value={presetCount + historyCount} icon={ShieldCheck} />
          </div>
        </header>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_430px]">
          <div className="space-y-5">
            <section className="work-panel animate-panel-in overflow-hidden" style={{ animationDelay: "0.04s" }}>
              <div className="panel-header flex flex-wrap items-center gap-3 px-4 py-3 md:px-5">
                <div>
                  <p className="section-kicker">Builder</p>
                  <h2 className="mt-1 text-lg font-black text-ink">Logic canvas</h2>
                </div>
                <div className="ml-auto flex flex-wrap items-center gap-2">
                  <span className="soft-chip" data-tone={canExecute ? "good" : "warn"}>
                    <Activity className="h-3.5 w-3.5" />
                    {canExecute ? "Valid" : `${issues.length} issues`}
                  </span>
                  <span className="soft-chip" data-tone="accent">
                    <Layers3 className="h-3.5 w-3.5" />
                    {treeMetrics.total} nodes
                  </span>
                </div>
              </div>
              <div className="query-canvas p-3 md:p-5">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                  <GroupNodeView nodeId={tree.rootId} depth={0} schema={schema} issuesByNode={issuesByNode} />
                </DndContext>
              </div>
            </section>
            <ResultsPanel schema={schema} results={results} canExecute={canExecute} onExecute={runQuery} />
          </div>
          <aside className="space-y-5 xl:sticky xl:top-5 xl:self-start">
            <PreviewPanel tree={tree} schema={schema} issues={issues} />
            <LibraryPanel />
          </aside>
        </div>
      </div>
    </main>
  );
}

function groupIssuesByNode(issues: ValidationIssue[]) {
  const map = new Map<string, ValidationIssue[]>();
  issues.forEach((issue) => {
    const nextIssues = map.get(issue.nodeId) ?? [];
    nextIssues.push(issue);
    map.set(issue.nodeId, nextIssues);
  });
  return map;
}

function getTreeMetrics(tree: QueryTree) {
  return Object.values(tree.nodes).reduce(
    (metrics, node) => {
      if (node.type === "group") {
        metrics.groups += 1;
      } else {
        metrics.rules += 1;
      }
      metrics.total += 1;
      return metrics;
    },
    { groups: 0, rules: 0, total: 0 }
  );
}

function Metric({ label, value, icon: Icon }: { label: string; value: number | string; icon: typeof Activity }) {
  return (
    <div className="glass-tile flex min-w-0 items-center gap-3 rounded-2xl px-3 py-2.5">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent/15 text-accent ring-1 ring-accentSoft/30">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-lg font-black leading-none text-ink">{value}</span>
        <span className="mt-1 block truncate text-xs font-bold uppercase tracking-wide text-inkSoft">{label}</span>
      </span>
    </div>
  );
}

