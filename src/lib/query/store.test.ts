import { beforeEach, describe, expect, it } from "vitest";
import { SCHEMAS } from "./schemas";
import { createInitialTree } from "./tree";
import { useQueryStore } from "./store";
import { validateImportedTree } from "./validation";
import { validateImportedTree } from "./validation";

function resetStore() {
  const schema = SCHEMAS[0];

  useQueryStore.setState({
    schemaId: schema.id,
    tree: createInitialTree(schema),
    selectedNodeId: null,
    previewFormat: "sql",
    execution: {
      loading: false,
      page: 1,
      pageSize: 5,
      sortField: schema.fields[0].key,
      sortDirection: "asc"
    },
    history: [],
    presets: [],
    importError: null
  });
}

describe("query store", () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetStore();
  });

  it("saves presets and persists them in localStorage", () => {
    useQueryStore.getState().savePreset("High value users");

    expect(useQueryStore.getState().presets).toHaveLength(1);
    expect(useQueryStore.getState().presets[0]?.name).toBe("High value users");
    expect(window.localStorage.getItem("visual-query-builder-presets")).toContain("High value users");
  });

  it("records execution history snapshots", () => {
    useQueryStore.getState().pushHistory("Executed query");

    expect(useQueryStore.getState().history).toHaveLength(1);
    expect(useQueryStore.getState().history[0]?.name).toBe("Executed query");
  });

  it("imports validated trees through the store", () => {
    const tree = createInitialTree(SCHEMAS[0]);
    const result = validateImportedTree(JSON.parse(JSON.stringify(tree)), SCHEMAS[0]);

    expect(result.ok).toBe(true);
    if (result.ok) {
      useQueryStore.getState().setImportedTree(result.tree);
      expect(useQueryStore.getState().tree.rootId).toBe(tree.rootId);
    }
  });

  it("surfaces import validation errors", () => {
    useQueryStore.getState().setImportError("Imported file must be valid JSON.");

    expect(useQueryStore.getState().importError).toBe("Imported file must be valid JSON.");
  });
});
