"use client";

import { memo } from "react";
import { getOperatorDefinition } from "@/lib/query/operators";
import type { FieldDefinition, Operator, RuleValue } from "@/lib/query/types";

type ValueEditorProps = {
  field: FieldDefinition;
  operator: Operator;
  value: RuleValue;
  onChange: (value: RuleValue) => void;
};

export const ValueEditor = memo(function ValueEditor({ field, operator, value, onChange }: ValueEditorProps) {
  const operatorDefinition = getOperatorDefinition(operator);

  if (operatorDefinition?.arity === "none") {
    return <span className="rounded-md border border-border bg-muted px-3 py-2 text-sm text-ink/70">No value</span>;
  }

  if (operatorDefinition?.arity === "range") {
    const [start, end] = Array.isArray(value) ? value : ["", ""];
    return (
      <div className="grid min-w-0 grid-cols-2 gap-2">
        <TypedInput field={field} value={start ?? ""} onChange={(nextValue) => onChange([nextValue as string | number, end as string | number])} />
        <TypedInput field={field} value={end ?? ""} onChange={(nextValue) => onChange([start as string | number, nextValue as string | number])} />
      </div>
    );
  }

  if (operatorDefinition?.arity === "array") {
    return (
      <input
        className="h-10 min-w-0 rounded-md border border-border bg-panel px-3 text-sm"
        value={Array.isArray(value) ? value.join(", ") : String(value ?? "")}
        onChange={(event) =>
          onChange(
            event.target.value
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean)
              .map((item) => (field.type === "number" ? Number(item) : item))
          )
        }
      />
    );
  }

  return <TypedInput field={field} value={value} onChange={onChange} />;
});

function TypedInput({ field, value, onChange }: { field: FieldDefinition; value: RuleValue | string | number; onChange: (value: RuleValue) => void }) {
  if (field.type === "enum") {
    return (
      <select className="h-10 min-w-0 rounded-md border border-border bg-panel px-3 text-sm" value={String(value ?? "")} onChange={(event) => onChange(event.target.value)}>
        {field.options?.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  if (field.type === "boolean") {
    return (
      <select className="h-10 min-w-0 rounded-md border border-border bg-panel px-3 text-sm" value={String(value)} onChange={(event) => onChange(event.target.value === "true")}>
        <option value="true">True</option>
        <option value="false">False</option>
      </select>
    );
  }

  return (
    <input
      className="h-10 min-w-0 rounded-md border border-border bg-panel px-3 text-sm"
      type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
      value={String(value ?? "")}
      onChange={(event) => onChange(field.type === "number" ? Number(event.target.value) : event.target.value)}
    />
  );
}
