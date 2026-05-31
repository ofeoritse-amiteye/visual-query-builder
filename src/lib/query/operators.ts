import type { FieldDefinition, FieldType, Operator, RuleValue } from "./types";

export type OperatorDefinition = {
  id: Operator;
  label: string;
  arity: "none" | "single" | "array" | "range";
  supportedTypes: FieldType[];
};

export const OPERATORS: OperatorDefinition[] = [
  { id: "equals", label: "Equals", arity: "single", supportedTypes: ["string", "number", "enum", "date", "boolean"] },
  { id: "notEquals", label: "Not equals", arity: "single", supportedTypes: ["string", "number", "enum", "date", "boolean"] },
  { id: "contains", label: "Contains", arity: "single", supportedTypes: ["string", "enum"] },
  { id: "startsWith", label: "Starts with", arity: "single", supportedTypes: ["string"] },
  { id: "greaterThan", label: "Greater than", arity: "single", supportedTypes: ["number", "date"] },
  { id: "lessThan", label: "Less than", arity: "single", supportedTypes: ["number", "date"] },
  { id: "inArray", label: "In array", arity: "array", supportedTypes: ["string", "number", "enum"] },
  { id: "between", label: "Between", arity: "range", supportedTypes: ["number", "date"] },
  { id: "regex", label: "Regex", arity: "single", supportedTypes: ["string"] },
  { id: "isNull", label: "Is null", arity: "none", supportedTypes: ["string", "number", "enum", "date", "boolean"] },
  { id: "isNotNull", label: "Is not null", arity: "none", supportedTypes: ["string", "number", "enum", "date", "boolean"] },
  { id: "before", label: "Before", arity: "single", supportedTypes: ["date"] },
  { id: "after", label: "After", arity: "single", supportedTypes: ["date"] }
];

export function getOperatorDefinition(operator: Operator) {
  return OPERATORS.find((candidate) => candidate.id === operator);
}

export function getOperatorsForField(field: FieldDefinition) {
  return OPERATORS.filter((operator) => operator.supportedTypes.includes(field.type));
}

export function getDefaultOperator(field: FieldDefinition): Operator {
  return getOperatorsForField(field)[0]?.id ?? "equals";
}

export function getDefaultValue(field: FieldDefinition, operator: Operator): RuleValue {
  const definition = getOperatorDefinition(operator);

  if (definition?.arity === "none") {
    return null;
  }

  if (definition?.arity === "range") {
    return field.type === "date" ? ["2026-01-01", "2026-12-31"] : [0, 100];
  }

  if (definition?.arity === "array") {
    return field.type === "number" ? [1, 2] : [field.options?.[0] ?? ""];
  }

  if (field.type === "number") {
    return 0;
  }

  if (field.type === "boolean") {
    return true;
  }

  if (field.type === "enum") {
    return field.options?.[0] ?? "";
  }

  if (field.type === "date") {
    return "2026-01-01";
  }

  return "";
}
