"use client";

import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Moon, Plus, Rows3, Sun } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { executeQuery } from "@/lib/query/execute";
import { SCHEMAS, getSchema } from "@/lib/query/schemas";
import { hydrateStoredSnapshots, useQueryStore } from "@/lib/query/store";
import { loadTheme, saveTheme } from "@/lib/query/storage";
import { validateTree } from "@/lib/query/validation";
import type { DataRecord, ValidationIssue } from "@/lib/query/types";
import { cn } from "@/lib/utils";
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
    <main className="min-h-screen px-4 py-5 md:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px]">
        <header className="mb-5 flex flex-wrap items-center gap-3 border-b border-border pb-4">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-ink md:text-2xl">Visual Query Builder</h1>
            <p className="mt-1 text-sm text-ink/60">Schema: {schema.label}</p>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <select className="h-10 rounded-md border border-border bg-panel px-3 text-sm" value={schemaId} onChange={(event) => selectSchema(event.target.value)}>
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
            <IconButton label={theme === "dark" ? "Light mode" : "Dark mode"} onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}>
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </IconButton>
          </div>
        </header>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
          <div className="space-y-5">
            <section className="rounded-md border border-border bg-panel p-4 shadow-soft">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/60">Builder</h2>
                <span className={cn("rounded-md px-2.5 py-1 text-xs", canExecute ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-100" : "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100")}>
                  {canExecute ? "Valid" : `${issues.length} issues`}
                </span>
              </div>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                <GroupNodeView nodeId={tree.rootId} depth={0} schema={schema} issuesByNode={issuesByNode} />
              </DndContext>
            </section>
            <ResultsPanel schema={schema} results={results} canExecute={canExecute} onExecute={runQuery} />
          </div>
          <aside className="space-y-5">
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
