import { getField } from "./tree";
import type { DataRecord, GroupNode, QueryTree, RuleNode, SchemaDefinition } from "./types";

export function executeQuery(tree: QueryTree, schema: SchemaDefinition) {
  return schema.dataset.filter((record) => evaluateNode(tree.rootId, tree, schema, record));
}

function evaluateNode(nodeId: string, tree: QueryTree, schema: SchemaDefinition, record: DataRecord): boolean {
  const node = tree.nodes[nodeId];
  if (!node) {
    return false;
  }

  if (node.type === "group") {
    return evaluateGroup(node, tree, schema, record);
  }

  return evaluateRule(node, schema, record);
}

function evaluateGroup(group: GroupNode, tree: QueryTree, schema: SchemaDefinition, record: DataRecord) {
  if (group.children.length === 0) {
    return false;
  }

  const results = group.children.map((childId) => evaluateNode(childId, tree, schema, record));
  return group.combinator === "AND" ? results.every(Boolean) : results.some(Boolean);
}

function evaluateRule(rule: RuleNode, schema: SchemaDefinition, record: DataRecord) {
  const field = getField(schema, rule.field);
  if (!field) {
    return false;
  }

  const recordValue = record[rule.field];
  const value = rule.value;

  switch (rule.operator) {
    case "equals":
      return compare(recordValue, value) === 0;
    case "notEquals":
      return compare(recordValue, value) !== 0;
    case "contains":
      return String(recordValue ?? "").toLowerCase().includes(String(value).toLowerCase());
    case "startsWith":
      return String(recordValue ?? "").toLowerCase().startsWith(String(value).toLowerCase());
    case "greaterThan":
    case "after":
      return compare(recordValue, value) > 0;
    case "lessThan":
    case "before":
      return compare(recordValue, value) < 0;
    case "inArray":
      return Array.isArray(value) && value.some((candidate) => compare(recordValue, candidate) === 0);
    case "between": {
      const [start, end] = Array.isArray(value) ? value : [];
      return compare(recordValue, start) >= 0 && compare(recordValue, end) <= 0;
    }
    case "regex":
      try {
        return new RegExp(String(value), "i").test(String(recordValue ?? ""));
      } catch {
        return false;
      }
    case "isNull":
      return recordValue === null || typeof recordValue === "undefined";
    case "isNotNull":
      return recordValue !== null && typeof recordValue !== "undefined";
  }
}

function compare(left: unknown, right: unknown) {
  if (typeof left === "number" || typeof right === "number") {
    return Number(left) - Number(right);
  }

  const leftDate = Date.parse(String(left));
  const rightDate = Date.parse(String(right));
  if (!Number.isNaN(leftDate) && !Number.isNaN(rightDate)) {
    return leftDate - rightDate;
  }

  return String(left ?? "").localeCompare(String(right ?? ""));
}
