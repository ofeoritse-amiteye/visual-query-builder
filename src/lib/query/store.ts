"use client";

import { create } from "zustand";
import { addGroup, addRule, cloneTree, createId, createInitialTree, moveChild, removeNode, updateGroup, updateRule } from "./tree";
import { getSchema, SCHEMAS } from "./schemas";
import { loadSnapshots, saveSnapshots } from "./storage";
import type { ExecutionState, GroupNode, PreviewFormat, QuerySnapshot, QueryTree, RuleNode } from "./types";

type QueryStore = {
  schemaId: string;
  tree: QueryTree;
  selectedNodeId: string | null;
  previewFormat: PreviewFormat;
  execution: ExecutionState;
  history: QuerySnapshot[];
  presets: QuerySnapshot[];
  importError: string | null;
  selectSchema: (schemaId: string) => void;
  setPreviewFormat: (format: PreviewFormat) => void;
  addRule: (groupId: string) => void;
  addGroup: (groupId: string) => void;
  updateRule: (ruleId: string, patch: Partial<Pick<RuleNode, "field" | "operator" | "value">>) => void;
  updateGroup: (groupId: string, patch: Partial<Pick<GroupNode, "combinator" | "collapsed">>) => void;
  removeNode: (nodeId: string) => void;
  moveChild: (parentId: string, activeId: string, overId: string) => void;
  selectNode: (nodeId: string | null) => void;
  pushHistory: (name?: string) => void;
  savePreset: (name?: string) => void;
  loadSnapshot: (snapshot: QuerySnapshot) => void;
  deletePreset: (snapshotId: string) => void;
  setImportedTree: (tree: QueryTree) => void;
  setImportError: (message: string | null) => void;
  setExecution: (patch: Partial<ExecutionState>) => void;
};

const defaultSchema = SCHEMAS[0];

export const useQueryStore = create<QueryStore>((set, get) => ({
  schemaId: defaultSchema.id,
  tree: createInitialTree(defaultSchema),
  selectedNodeId: null,
  previewFormat: "sql",
  execution: {
    loading: false,
    page: 1,
    pageSize: 5,
    sortField: defaultSchema.fields[0].key,
    sortDirection: "asc"
  },
  history: [],
  presets: [],
  importError: null,
  selectSchema: (schemaId) => {
    const schema = getSchema(schemaId);
    set({
      schemaId,
      tree: createInitialTree(schema),
      selectedNodeId: null,
      execution: { ...get().execution, page: 1, sortField: schema.fields[0].key }
    });
  },
  setPreviewFormat: (previewFormat) => set({ previewFormat }),
  addRule: (groupId) => set((state) => ({ tree: addRule(state.tree, getSchema(state.schemaId), groupId) })),
  addGroup: (groupId) => set((state) => ({ tree: addGroup(state.tree, getSchema(state.schemaId), groupId) })),
  updateRule: (ruleId, patch) => set((state) => ({ tree: updateRule(state.tree, getSchema(state.schemaId), ruleId, patch), execution: { ...state.execution, page: 1 } })),
  updateGroup: (groupId, patch) => set((state) => ({ tree: updateGroup(state.tree, groupId, patch) })),
  removeNode: (nodeId) => set((state) => ({ tree: removeNode(state.tree, nodeId), selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId })),
  moveChild: (parentId, activeId, overId) => set((state) => ({ tree: moveChild(state.tree, parentId, activeId, overId) })),
  selectNode: (selectedNodeId) => set({ selectedNodeId }),
  pushHistory: (name) => {
    const state = get();
    const nextSnapshot = createSnapshot(state.schemaId, state.tree, name ?? "Executed query");
    const history = [nextSnapshot, ...state.history].slice(0, 12);
    saveSnapshots("history", history);
    set({ history });
  },
  savePreset: (name) => {
    const state = get();
    const nextSnapshot = createSnapshot(state.schemaId, state.tree, name ?? `Preset ${state.presets.length + 1}`);
    const presets = [nextSnapshot, ...state.presets].slice(0, 12);
    saveSnapshots("presets", presets);
    set({ presets });
  },
  loadSnapshot: (snapshot) => {
    const schema = getSchema(snapshot.schemaId);
    set({
      schemaId: schema.id,
      tree: cloneTree(snapshot.tree),
      selectedNodeId: null,
      execution: { ...get().execution, page: 1, sortField: schema.fields[0].key }
    });
  },
  deletePreset: (snapshotId) => {
    const presets = get().presets.filter((preset) => preset.id !== snapshotId);
    saveSnapshots("presets", presets);
    set({ presets });
  },
  setImportedTree: (tree) => set({ tree, importError: null, selectedNodeId: null }),
  setImportError: (importError) => set({ importError }),
  setExecution: (patch) => set((state) => ({ execution: { ...state.execution, ...patch } }))
}));

export function hydrateStoredSnapshots() {
  useQueryStore.setState({
    history: loadSnapshots("history"),
    presets: loadSnapshots("presets")
  });
}

function createSnapshot(schemaId: string, tree: QueryTree, name: string): QuerySnapshot {
  return {
    id: createId("snapshot"),
    name,
    schemaId,
    tree: cloneTree(tree),
    createdAt: new Date().toISOString()
  };
}
