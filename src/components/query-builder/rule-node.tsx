"use client";

import { memo, useMemo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import { getOperatorsForField } from "@/lib/query/operators";
import { getField } from "@/lib/query/tree";
import { useQueryStore } from "@/lib/query/store";
import type { SchemaDefinition, ValidationIssue } from "@/lib/query/types";
import { cn } from "@/lib/utils";
import { IconButton } from "./icon-button";
import { ValueEditor } from "./value-editor";

type RuleNodeProps = {
  nodeId: string;
  parentId: string;
  schema: SchemaDefinition;
  issues: ValidationIssue[];
};

export const RuleNodeView = memo(function RuleNodeView({ nodeId, parentId, schema, issues }: RuleNodeProps) {
  const rule = useQueryStore((state) => state.tree.nodes[nodeId]);
  const updateRule = useQueryStore((state) => state.updateRule);
  const removeNode = useQueryStore((state) => state.removeNode);
  const selectNode = useQueryStore((state) => state.selectNode);
  const selectedNodeId = useQueryStore((state) => state.selectedNodeId);
  const sortable = useSortable({ id: nodeId, data: { parentId, type: "rule" } });

  const field = rule?.type === "rule" ? getField(schema, rule.field) ?? schema.fields[0] : schema.fields[0];
  const operators = useMemo(() => getOperatorsForField(field), [field]);

  if (!rule || rule.type !== "rule") {
    return null;
  }

  return (
    <div
      ref={sortable.setNodeRef}
      style={{ transform: CSS.Transform.toString(sortable.transform), transition: sortable.transition }}
      className={cn(
        "grid gap-2 rounded-md border border-border bg-panel p-2 shadow-sm transition",
        "md:grid-cols-[32px_minmax(130px,1fr)_minmax(140px,1fr)_minmax(160px,1.4fr)_40px]",
        selectedNodeId === nodeId && "border-accent ring-2 ring-accent/20",
        sortable.isDragging && "z-20 opacity-80"
      )}
      onFocus={() => selectNode(nodeId)}
      onClick={() => selectNode(nodeId)}
      data-testid="rule-node"
    >
      <button
        type="button"
        aria-label="Drag condition"
        title="Drag condition"
        className="flex h-10 w-8 items-center justify-center rounded-md text-ink/45 hover:bg-muted hover:text-ink"
        {...sortable.attributes}
        {...sortable.listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <select className="h-10 min-w-0 rounded-md border border-border bg-panel px-3 text-sm" value={rule.field} onChange={(event) => updateRule(nodeId, { field: event.target.value })}>
        {schema.fields.map((candidate) => (
          <option key={candidate.key} value={candidate.key}>
            {candidate.label}
          </option>
        ))}
      </select>
      <select className="h-10 min-w-0 rounded-md border border-border bg-panel px-3 text-sm" value={rule.operator} onChange={(event) => updateRule(nodeId, { operator: event.target.value as typeof rule.operator })}>
        {operators.map((operator) => (
          <option key={operator.id} value={operator.id}>
            {operator.label}
          </option>
        ))}
      </select>
      <ValueEditor field={field} operator={rule.operator} value={rule.value} onChange={(value) => updateRule(nodeId, { value })} />
      <IconButton label="Remove condition" variant="danger" onClick={() => removeNode(nodeId)}>
        <Trash2 className="h-4 w-4" />
      </IconButton>
      {issues.length > 0 && <p className="md:col-span-5 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-100">{issues[0].message}</p>}
    </div>
  );
});
