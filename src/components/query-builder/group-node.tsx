"use client";

import { memo } from "react";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, ChevronRight, FolderPlus, GripVertical, Plus, Trash2 } from "lucide-react";
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

  return (
    <section
      ref={sortable.setNodeRef}
      style={{ transform: CSS.Transform.toString(sortable.transform), transition: sortable.transition }}
      className={cn(
        "rounded-md border bg-muted/35 p-3 transition",
        selectedNodeId === nodeId ? "border-accent ring-2 ring-accent/20" : "border-border",
        sortable.isDragging && "z-20 opacity-80"
      )}
      onFocus={() => selectNode(nodeId)}
      onClick={(event) => {
        event.stopPropagation();
        selectNode(nodeId);
      }}
      data-testid="group-node"
    >
      <div className="flex flex-wrap items-center gap-2">
        {!isRoot && (
          <button
            type="button"
            aria-label="Drag group"
            title="Drag group"
            className="flex h-9 w-8 items-center justify-center rounded-md text-ink/45 hover:bg-panel hover:text-ink"
            {...sortable.attributes}
            {...sortable.listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>
        )}
        <IconButton label={node.collapsed ? "Expand group" : "Collapse group"} onClick={() => updateGroup(nodeId, { collapsed: !node.collapsed })}>
          {node.collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </IconButton>
        <div className="inline-flex rounded-md border border-border bg-panel p-1">
          {(["AND", "OR"] as const).map((combinator) => (
            <button
              key={combinator}
              type="button"
              className={cn("h-8 rounded px-3 text-xs font-semibold transition", node.combinator === combinator ? "bg-accent text-slate-950" : "text-ink/65 hover:bg-muted")}
              onClick={() => updateGroup(nodeId, { combinator })}
            >
              {combinator}
            </button>
          ))}
        </div>
        <span className="rounded-md border border-border bg-panel px-2.5 py-1 text-xs text-ink/70">{node.children.length} nodes</span>
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

      {issues.length > 0 && <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-100">{issues[0].message}</p>}

      {!node.collapsed && (
        <SortableContext items={node.children} strategy={verticalListSortingStrategy}>
          <div className="mt-3 space-y-3 border-l border-border pl-3 animate-group-expand" style={{ marginLeft: Math.min(depth, 8) * 2 }}>
            {node.children.map((childId) => {
              const child = useQueryStore.getState().tree.nodes[childId];
              if (child?.type === "group") {
                return <GroupNodeView key={childId} nodeId={childId} parentId={nodeId} depth={depth + 1} schema={schema} issuesByNode={issuesByNode} />;
              }

              return <RuleNodeView key={childId} nodeId={childId} parentId={nodeId} schema={schema} issues={issuesByNode.get(childId) ?? []} />;
            })}
          </div>
        </SortableContext>
      )}
    </section>
  );
});
