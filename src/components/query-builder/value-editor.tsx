"use client";

import { memo } from "react";
import { getOperatorDefinition } from "@/lib/query/operators";
import type { FieldDefinition, Operator, RuleValue } from "@/lib/query/types";
import { cn } from "@/lib/utils";

type ValueEditorProps = {
  field: FieldDefinition;
  operator: Operator;
  value: RuleValue;
  onChange: (value: RuleValue) => void;
};

export const ValueEditor = memo(function ValueEditor({ field, operator, value, onChange }: ValueEditorProps) {
  const operatorDefinition = getOperatorDefinition(operator);

  if (operatorDefinition?.arity === "none") {
    return <span className="inline-flex h-10 items-center rounded-lg border border-border/80 bg-muted/70 px-3 text-sm font-semibold text-inkSoft">No value</span>;
  }

  if (operatorDefinition?.arity === "range") {
    const [start, end] = Array.isArray(value) ? value : ["", ""];
    return (
      <div className="grid min-w-0 grid-cols-2 gap-2">
        <TypedInput field={field} value={start ?? ""} placeholder="From" onChange={(nextValue) => onChange([nextValue as string | number, end as string | number])} />
        <TypedInput field={field} value={end ?? ""} placeholder="To" onChange={(nextValue) => onChange([start as string | number, nextValue as string | number])} />
      </div>
    );
  }

  if (operatorDefinition?.arity === "array") {
    return (
      <input
        className="field-control w-full text-sm"
        aria-label={`${field.label} values`}
        placeholder="Comma separated"
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

function TypedInput({
  field,
  value,
  placeholder,
  onChange
}: {
  field: FieldDefinition;
  value: RuleValue | string | number;
  placeholder?: string;
  onChange: (value: RuleValue) => void;
}) {
  if (field.type === "enum") {
    return (
      <select className="field-control w-full text-sm" value={String(value ?? "")} onChange={(event) => onChange(event.target.value)}>
        {field.options?.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  if (field.type === "boolean") {
    const isTrue = value === true || value === "true";

    return (
      <div className="grid h-10 min-w-0 grid-cols-2 rounded-lg border border-border/85 bg-panel/80 p-1 shadow-sm" role="group" aria-label={`${field.label} value`}>
        {[
          { label: "True", value: true },
          { label: "False", value: false }
        ].map((option) => (
          <button
            key={option.label}
            type="button"
            aria-pressed={isTrue === option.value}
            className={cn("rounded-md text-xs font-black transition", isTrue === option.value ? "bg-accent text-white shadow-sm" : "text-inkSoft hover:bg-muted hover:text-ink")}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <input
      className="field-control w-full text-sm"
      type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
      aria-label={`${field.label} value`}
      placeholder={placeholder}
      value={String(value ?? "")}
      onChange={(event) => onChange(field.type === "number" ? (event.target.value === "" ? "" : Number(event.target.value)) : event.target.value)}
    />
  );
}
