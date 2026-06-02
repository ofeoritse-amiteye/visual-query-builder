"use client";

import { memo, useMemo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CalendarDays, GripVertical, Hash, ListFilter, ToggleLeft, Trash2, Type } from "lucide-react";
import { getOperatorsForField } from "@/lib/query/operators";
import { getField } from "@/lib/query/tree";
import { useQueryStore } from "@/lib/query/store";
import type { FieldDefinition, SchemaDefinition, ValidationIssue } from "@/lib/query/types";
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
        "rule-node grid gap-2.5 rounded-lg border border-border/85 p-2.5 shadow-sm transition duration-200",
        "md:grid-cols-[36px_minmax(170px,1fr)_minmax(160px,0.9fr)_minmax(190px,1.2fr)_40px] md:gap-3",
        selectedNodeId === nodeId && "border-accent ring-4 ring-accent/15",
        sortable.isDragging && "z-20 scale-[0.995] opacity-85 shadow-lift"
      )}
      onFocus={() => selectNode(nodeId)}
      onClick={() => selectNode(nodeId)}
      data-testid="rule-node"
    >
      <button
        type="button"
        aria-label="Drag condition"
        title="Drag condition"
        className="flex h-10 w-8 items-center justify-center rounded-lg text-inkSoft transition hover:bg-muted hover:text-accent"
        {...sortable.attributes}
        {...sortable.listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="relative isolate min-w-0">
        <FieldIcon field={field} className="field-control-icon h-4 w-4 text-accent" />
        <select className="field-control field-control-leading w-full text-sm font-semibold" value={rule.field} onChange={(event) => updateRule(nodeId, { field: event.target.value })}>
          {schema.fields.map((candidate) => (
            <option key={candidate.key} value={candidate.key}>
              {candidate.label}
            </option>
          ))}
        </select>
      </div>
      <div className="relative isolate min-w-0">
        <ListFilter className="field-control-icon h-4 w-4 text-inkSoft" />
        <select className="field-control field-control-leading w-full text-sm" value={rule.operator} onChange={(event) => updateRule(nodeId, { operator: event.target.value as typeof rule.operator })}>
          {operators.map((operator) => (
            <option key={operator.id} value={operator.id}>
              {operator.label}
            </option>
          ))}
        </select>
      </div>
      <ValueEditor field={field} operator={rule.operator} value={rule.value} onChange={(value) => updateRule(nodeId, { value })} />
      <IconButton label="Remove condition" variant="danger" onClick={() => removeNode(nodeId)}>
        <Trash2 className="h-4 w-4" />
      </IconButton>
      {issues.length > 0 && <p className="rounded-lg border border-warn/25 bg-warn/10 px-3 py-2 text-sm font-medium text-warn md:col-span-5">{issues[0].message}</p>}
    </div>
  );
});

function FieldIcon({ field, className }: { field: FieldDefinition; className?: string }) {
  if (field.type === "number") {
    return <Hash className={className} />;
  }

  if (field.type === "date") {
    return <CalendarDays className={className} />;
  }

  if (field.type === "enum") {
    return <ListFilter className={className} />;
  }

  if (field.type === "boolean") {
    return <ToggleLeft className={className} />;
  }

  return <Type className={className} />;
}
