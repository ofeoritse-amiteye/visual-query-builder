import { getOperatorDefinition, getOperatorsForField } from "./operators";
import { getField, sanitizeRuleForSchema } from "./tree";
import type { GroupNode, QueryNode, QueryTree, RuleNode, SchemaDefinition, ValidationIssue } from "./types";

export function validateTree(tree: QueryTree, schema: SchemaDefinition): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const visited = new Set<string>();

  if (!tree.nodes[tree.rootId] || tree.nodes[tree.rootId].type !== "group") {
    return [{ nodeId: tree.rootId, message: "Root group is missing or malformed.", severity: "error" }];
  }

  visitNode(tree.rootId, tree, schema, issues, visited);

  Object.keys(tree.nodes).forEach((nodeId) => {
    if (!visited.has(nodeId)) {
      issues.push({ nodeId, message: "Node is detached from the root query.", severity: "warning" });
    }
  });

  return issues;
}

export function validateImportedTree(value: unknown, schema: SchemaDefinition): { ok: true; tree: QueryTree } | { ok: false; message: string } {
  if (!isObject(value) || typeof value.rootId !== "string" || !isObject(value.nodes)) {
    return { ok: false, message: "Imported JSON must contain rootId and nodes." };
  }

  const rawNodes = value.nodes as Record<string, unknown>;
  const nextNodes: Record<string, QueryNode> = {};

  for (const [id, node] of Object.entries(rawNodes)) {
    if (!isObject(node) || node.id !== id) {
      return { ok: false, message: `Node ${id} is malformed.` };
    }

    if (node.type === "group") {
      if ((node.combinator !== "AND" && node.combinator !== "OR") || !Array.isArray(node.children) || !node.children.every((child) => typeof child === "string")) {
        return { ok: false, message: `Group ${id} is malformed.` };
      }

      nextNodes[id] = {
        id,
        type: "group",
        combinator: node.combinator,
        children: [...new Set(node.children)],
        collapsed: Boolean(node.collapsed)
      } satisfies GroupNode;
      continue;
    }

    if (node.type === "rule") {
      if (typeof node.field !== "string" || typeof node.operator !== "string") {
        return { ok: false, message: `Rule ${id} is malformed.` };
      }

      nextNodes[id] = sanitizeRuleForSchema(
        {
          id,
          type: "rule",
          field: node.field,
          operator: node.operator as RuleNode["operator"],
          value: normalizeUnknownValue(node.value)
        },
        schema
      );
      continue;
    }

    return { ok: false, message: `Node ${id} has an unsupported type.` };
  }

  const tree = { rootId: value.rootId, nodes: nextNodes };
  const structureIssues = validateStructure(tree);
  if (structureIssues) {
    return { ok: false, message: structureIssues };
  }

  return { ok: true, tree };
}

function visitNode(nodeId: string, tree: QueryTree, schema: SchemaDefinition, issues: ValidationIssue[], visited: Set<string>) {
  const node = tree.nodes[nodeId];

  if (!node) {
    issues.push({ nodeId, message: "Missing node reference.", severity: "error" });
    return;
  }

  if (visited.has(nodeId)) {
    issues.push({ nodeId, message: "Circular query reference detected.", severity: "error" });
    return;
  }

  visited.add(nodeId);

  if (node.type === "group") {
    validateGroup(node, tree, schema, issues, visited);
  } else {
    validateRule(node, schema, issues);
  }
}

function validateGroup(node: GroupNode, tree: QueryTree, schema: SchemaDefinition, issues: ValidationIssue[], visited: Set<string>) {
  if (node.children.length === 0) {
    issues.push({ nodeId: node.id, message: "Group must contain at least one condition.", severity: "error" });
  }

  node.children.forEach((childId) => visitNode(childId, tree, schema, issues, visited));
}

function validateRule(rule: RuleNode, schema: SchemaDefinition, issues: ValidationIssue[]) {
  const field = getField(schema, rule.field);
  if (!field) {
    issues.push({ nodeId: rule.id, message: "Selected field is not available in this schema.", severity: "error" });
    return;
  }

  const allowedOperators = getOperatorsForField(field).map((operator) => operator.id);
  if (!allowedOperators.includes(rule.operator)) {
    issues.push({ nodeId: rule.id, message: `${rule.operator} cannot be used with ${field.label}.`, severity: "error" });
    return;
  }

  const operator = getOperatorDefinition(rule.operator);
  if (!operator || operator.arity === "none") {
    return;
  }

  if (operator.arity === "range") {
    validateRange(rule, field.type, issues);
    return;
  }

  if (operator.arity === "array") {
    if (!Array.isArray(rule.value) || rule.value.length === 0 || rule.value.some((item) => String(item).trim() === "")) {
      issues.push({ nodeId: rule.id, message: "Array comparisons need at least one value.", severity: "error" });
    }
    return;
  }

  if (rule.value === null || String(rule.value).trim() === "") {
    issues.push({ nodeId: rule.id, message: "Condition value cannot be empty.", severity: "error" });
  }

  if (field.type === "date" && Number.isNaN(Date.parse(String(rule.value)))) {
    issues.push({ nodeId: rule.id, message: "Date value is invalid.", severity: "error" });
  }

  if (rule.operator === "regex") {
    try {
      new RegExp(String(rule.value));
    } catch {
      issues.push({ nodeId: rule.id, message: "Regex pattern is invalid.", severity: "error" });
    }
  }
}

function validateRange(rule: RuleNode, fieldType: string, issues: ValidationIssue[]) {
  if (!Array.isArray(rule.value) || rule.value.length < 2) {
    issues.push({ nodeId: rule.id, message: "Between comparisons need a start and end value.", severity: "error" });
    return;
  }

  const [start, end] = rule.value;
  const startValue = fieldType === "date" ? Date.parse(String(start)) : Number(start);
  const endValue = fieldType === "date" ? Date.parse(String(end)) : Number(end);

  if (!Number.isFinite(startValue) || !Number.isFinite(endValue)) {
    issues.push({ nodeId: rule.id, message: "Range values are invalid.", severity: "error" });
    return;
  }

  if (startValue > endValue) {
    issues.push({ nodeId: rule.id, message: "Range start must be before the range end.", severity: "error" });
  }
}

function validateStructure(tree: QueryTree) {
  const root = tree.nodes[tree.rootId];
  if (!root || root.type !== "group") {
    return "Imported query must have a valid root group.";
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();

  function walk(nodeId: string): string | null {
    if (visiting.has(nodeId)) {
      return "Imported query cannot contain circular references.";
    }

    const node = tree.nodes[nodeId];
    if (!node) {
      return `Imported query references missing node ${nodeId}.`;
    }

    if (visited.has(nodeId)) {
      return null;
    }

    visiting.add(nodeId);
    if (node.type === "group") {
      for (const childId of node.children) {
        const error = walk(childId);
        if (error) {
          return error;
        }
      }
    }
    visiting.delete(nodeId);
    visited.add(nodeId);
    return null;
  }

  return walk(tree.rootId);
}

function normalizeUnknownValue(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter((item): item is string | number => typeof item === "string" || typeof item === "number");
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean" || value === null) {
    return value;
  }

  return "";
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
