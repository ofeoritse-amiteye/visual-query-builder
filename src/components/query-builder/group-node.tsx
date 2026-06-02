"use client";

import { memo, type CSSProperties } from "react";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, ChevronRight, FolderPlus, GitBranch, GripVertical, Plus, Trash2 } from "lucide-react";
import { useQueryStore } from "@/lib/query/store";
import type { SchemaDefinition, ValidationIssue } from "@/lib/query/types";
import { cn } from "@/lib/utils";
import { IconButton } from "./icon-button";
import { RuleNodeView } from "./rule-node";

type GroupNodeProps = {
  nodeId: string;
  parentId?: string;
  depth: number;
  schema: SchemaDefinition;
  issuesByNode: Map<string, ValidationIssue[]>;
};

const NODE_TONES = ["59 130 246", "96 165 250", "37 99 235", "125 211 252"];

export const GroupNodeView = memo(function GroupNodeView({ nodeId, parentId, depth, schema, issuesByNode }: GroupNodeProps) {
  const node = useQueryStore((state) => state.tree.nodes[nodeId]);
  const rootId = useQueryStore((state) => state.tree.rootId);
  const addRule = useQueryStore((state) => state.addRule);
  const addGroup = useQueryStore((state) => state.addGroup);
  const updateGroup = useQueryStore((state) => state.updateGroup);
  const removeNode = useQueryStore((state) => state.removeNode);
  const selectNode = useQueryStore((state) => state.selectNode);
  const selectedNodeId = useQueryStore((state) => state.selectedNodeId);
  const sortable = useSortable({ id: nodeId, data: { parentId, type: "group" }, disabled: !parentId });

  if (!node || node.type !== "group") {
    return null;
  }

  const isRoot = node.id === rootId;
  const issues = issuesByNode.get(nodeId) ?? [];
  const nodeStyle = {
    "--node-accent": NODE_TONES[depth % NODE_TONES.length],
    marginLeft: Math.min(depth, 8) * 2,
    transform: CSS.Transform.toString(sortable.transform),
    transition: sortable.transition
  } as CSSProperties;

  return (
    <section
      ref={sortable.setNodeRef}
      style={nodeStyle}
      className={cn(
        "group-node relative rounded-lg border p-3 transition duration-200 md:p-4",
        selectedNodeId === nodeId ? "border-accent ring-4 ring-accent/15" : "border-border/85 hover:border-accent/35",
        sortable.isDragging && "z-20 rotate-[0.2deg] scale-[0.995] opacity-85 shadow-lift"
      )}
      onFocus={() => selectNode(nodeId)}
      onClick={(event) => {
        event.stopPropagation();
        selectNode(nodeId);
      }}
      data-testid="group-node"
    >
      <div className="flex flex-wrap items-center gap-2.5">
        {!isRoot && (
          <button
            type="button"
            aria-label="Drag group"
            title="Drag group"
            className="flex h-9 w-8 items-center justify-center rounded-lg text-inkSoft transition hover:bg-panel hover:text-accent"
            {...sortable.attributes}
            {...sortable.listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>
        )}
        <IconButton label={node.collapsed ? "Expand group" : "Collapse group"} onClick={() => updateGroup(nodeId, { collapsed: !node.collapsed })}>
          {node.collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </IconButton>
        <div className="inline-flex rounded-lg border border-border/80 bg-panel/85 p-1 shadow-sm">
          {(["AND", "OR"] as const).map((combinator) => (
            <button
              key={combinator}
              type="button"
              className={cn(
                "h-8 rounded-md px-3 text-xs font-black transition duration-200",
                node.combinator === combinator ? "bg-accent text-white shadow-[0_8px_22px_rgb(var(--accent-deep)/0.32)]" : "text-inkSoft hover:bg-muted/80 hover:text-ink"
              )}
              onClick={() => updateGroup(nodeId, { combinator })}
            >
              {combinator}
            </button>
          ))}
        </div>
        <span className="soft-chip">
          <GitBranch className="h-3.5 w-3.5" />
          {node.children.length} nodes
        </span>
        {node.collapsed && <span className="soft-chip" data-tone="accent">Collapsed</span>}
        <div className="ml-auto flex items-center gap-2">
          <IconButton label="Add condition" onClick={() => addRule(nodeId)}>
            <Plus className="h-4 w-4" />
          </IconButton>
          <IconButton label="Add group" onClick={() => addGroup(nodeId)}>
            <FolderPlus className="h-4 w-4" />
          </IconButton>
          {!isRoot && (
            <IconButton label="Remove group" variant="danger" onClick={() => removeNode(nodeId)}>
              <Trash2 className="h-4 w-4" />
            </IconButton>
          )}
        </div>
      </div>

      {issues.length > 0 && (
        <p className="mt-3 rounded-lg border border-warn/25 bg-warn/10 px-3 py-2 text-sm font-medium text-warn">{issues[0].message}</p>
      )}

      {!node.collapsed && (
        <SortableContext items={node.children} strategy={verticalListSortingStrategy}>
          <div className="mt-3 space-y-3 border-l border-dashed border-border/90 pl-3 animate-group-expand md:pl-4">
            {node.children.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border/80 bg-panel/50 px-3 py-5 text-center text-sm font-medium text-inkSoft">Empty group</div>
            ) : (
              node.children.map((childId) => {
                const child = useQueryStore.getState().tree.nodes[childId];
                if (child?.type === "group") {
                  return <GroupNodeView key={childId} nodeId={childId} parentId={nodeId} depth={depth + 1} schema={schema} issuesByNode={issuesByNode} />;
                }

                return <RuleNodeView key={childId} nodeId={childId} parentId={nodeId} schema={schema} issues={issuesByNode.get(childId) ?? []} />;
              })
            )}
          </div>
        </SortableContext>
      )}
    </section>
  );
});
