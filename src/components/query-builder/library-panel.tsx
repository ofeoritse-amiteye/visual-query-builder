"use client";

import { Download, History, Save, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { getSchema } from "@/lib/query/schemas";
import { useQueryStore } from "@/lib/query/store";
import { validateImportedTree } from "@/lib/query/validation";
import { cn } from "@/lib/utils";
import { IconButton } from "./icon-button";

export function LibraryPanel() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
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
    <section className="work-panel animate-panel-in overflow-hidden" style={{ animationDelay: "0.16s" }}>
      <div className="panel-header flex items-center gap-2 px-4 py-3">
        <div>
          <p className="section-kicker">Library</p>
          <h2 className="mt-1 text-lg font-black text-ink">Presets and history</h2>
        </div>
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
      </div>

      <div className="p-4">
        <button
          type="button"
          className={cn(
            "w-full rounded-lg border border-dashed px-3 py-4 text-left transition duration-200",
            dragActive ? "border-accent bg-accent/10" : "border-border/90 bg-muted/35 hover:border-accent/45 hover:bg-muted/55"
          )}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragActive(false);
            const file = event.dataTransfer.files?.[0];
            if (file) {
              void importJson(file);
            }
          }}
        >
          <span className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-panel text-accent shadow-sm">
              <Upload className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-black text-ink">Import query JSON</span>
              <span className="mt-1 block text-xs font-medium text-inkSoft">Drop a file here or open the file picker.</span>
            </span>
          </span>
        </button>
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

        {importError && <p className="mt-3 rounded-lg border border-danger/25 bg-danger/10 px-3 py-2 text-sm font-medium text-danger">{importError}</p>}

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-1">
          <SnapshotList title="Saved presets" empty="No saved presets" snapshots={presets} onLoad={loadSnapshot} onDelete={deletePreset} />
          <SnapshotList title="History" empty="No executions yet" snapshots={history} onLoad={loadSnapshot} />
        </div>
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
      <h3 className="mb-2 flex items-center gap-2 text-sm font-black text-ink">
        <History className="h-4 w-4" />
        {title}
        <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs font-black text-inkSoft">{snapshots.length}</span>
      </h3>
      <div className="space-y-2">
        {snapshots.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border/90 bg-muted/25 px-3 py-4 text-sm font-medium text-inkSoft">{empty}</p>
        ) : (
          snapshots.map((snapshot) => (
            <div key={snapshot.id} className="flex items-center gap-2 rounded-lg border border-border/80 bg-panel/75 p-2 shadow-sm transition hover:border-accent/35 hover:bg-muted/45">
              <button type="button" className="min-w-0 flex-1 rounded-md px-1 text-left text-sm hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50" onClick={() => onLoad(snapshot)}>
                <span className="block truncate font-black">{snapshot.name}</span>
                <span className="mt-0.5 block truncate text-xs font-medium text-inkSoft">{new Date(snapshot.createdAt).toLocaleString()}</span>
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
