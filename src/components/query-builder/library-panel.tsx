"use client";

import { Download, History, Save, Trash2, Upload } from "lucide-react";
import { useRef } from "react";
import { getSchema } from "@/lib/query/schemas";
import { useQueryStore } from "@/lib/query/store";
import { validateImportedTree } from "@/lib/query/validation";
import { IconButton } from "./icon-button";

export function LibraryPanel() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tree = useQueryStore((state) => state.tree);
  const schemaId = useQueryStore((state) => state.schemaId);
  const history = useQueryStore((state) => state.history);
  const presets = useQueryStore((state) => state.presets);
  const importError = useQueryStore((state) => state.importError);
  const savePreset = useQueryStore((state) => state.savePreset);
  const loadSnapshot = useQueryStore((state) => state.loadSnapshot);
  const deletePreset = useQueryStore((state) => state.deletePreset);
  const setImportedTree = useQueryStore((state) => state.setImportedTree);
  const setImportError = useQueryStore((state) => state.setImportError);

  function exportJson() {
    const blob = new Blob([JSON.stringify(tree, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `query-${schemaId}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function importJson(file: File) {
    try {
      const parsed = JSON.parse(await file.text());
      const result = validateImportedTree(parsed, getSchema(schemaId));
      if (result.ok) {
        setImportedTree(result.tree);
      } else {
        setImportError(result.message);
      }
    } catch {
      setImportError("Imported file must be valid JSON.");
    }
  }

  return (
    <section className="rounded-md border border-border bg-panel p-4 shadow-soft">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/60">Library</h2>
        <div className="ml-auto flex gap-2">
          <IconButton label="Save preset" onClick={() => savePreset()}>
            <Save className="h-4 w-4" />
          </IconButton>
          <IconButton label="Export JSON" onClick={exportJson}>
            <Download className="h-4 w-4" />
          </IconButton>
          <IconButton label="Import JSON" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4" />
          </IconButton>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          data-testid="import-json-input"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              void importJson(file);
            }
            event.target.value = "";
          }}
        />
      </div>
      {importError && <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-100">{importError}</p>}
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-1">
        <SnapshotList title="Saved presets" empty="No saved presets" snapshots={presets} onLoad={loadSnapshot} onDelete={deletePreset} />
        <SnapshotList title="History" empty="No executions yet" snapshots={history} onLoad={loadSnapshot} />
      </div>
    </section>
  );
}

function SnapshotList({
  title,
  empty,
  snapshots,
  onLoad,
  onDelete
}: {
  title: string;
  empty: string;
  snapshots: ReturnType<typeof useQueryStore.getState>["history"];
  onLoad: (snapshot: ReturnType<typeof useQueryStore.getState>["history"][number]) => void;
  onDelete?: (snapshotId: string) => void;
}) {
  return (
    <div>
      <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink/75">
        <History className="h-4 w-4" />
        {title}
      </h3>
      <div className="space-y-2">
        {snapshots.length === 0 ? (
          <p className="rounded-md border border-dashed border-border px-3 py-4 text-sm text-ink/55">{empty}</p>
        ) : (
          snapshots.map((snapshot) => (
            <div key={snapshot.id} className="flex items-center gap-2 rounded-md border border-border bg-muted/45 p-2">
              <button type="button" className="min-w-0 flex-1 text-left text-sm hover:text-accent" onClick={() => onLoad(snapshot)}>
                <span className="block truncate font-medium">{snapshot.name}</span>
                <span className="block truncate text-xs text-ink/50">{new Date(snapshot.createdAt).toLocaleString()}</span>
              </button>
              {onDelete && (
                <IconButton label="Delete preset" variant="danger" onClick={() => onDelete(snapshot.id)}>
                  <Trash2 className="h-4 w-4" />
                </IconButton>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
