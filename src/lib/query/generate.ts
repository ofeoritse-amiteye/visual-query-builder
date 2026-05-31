import { getOperatorDefinition } from "./operators";
import { getField } from "./tree";
import type { Operator, QueryTree, RuleNode, RuleValue, SchemaDefinition } from "./types";

export function generateSql(tree: QueryTree, schema: SchemaDefinition) {
  return `SELECT * FROM ${escapeIdentifier(schema.tableName)}\nWHERE ${renderSqlNode(tree.rootId, tree, schema) || "1 = 1"};`;
}

export function generateMongo(tree: QueryTree, schema: SchemaDefinition) {
  const query = renderMongoNode(tree.rootId, tree, schema);
  return JSON.stringify(query ?? {}, null, 2);
}

export function generateGraphql(tree: QueryTree, schema: SchemaDefinition) {
  const filter = renderGraphqlNode(tree.rootId, tree, schema);
  return `query ${pascalCase(schema.tableName)}Query {\n  ${schema.tableName}(filter: ${toGraphqlInput(filter ?? {})}) {\n    ${schema.fields.map((field) => field.key).join("\n    ")}\n  }\n}`;
}

function renderSqlNode(nodeId: string, tree: QueryTree, schema: SchemaDefinition): string {
  const node = tree.nodes[nodeId];
  if (!node) {
    return "";
  }

  if (node.type === "group") {
    const parts = node.children.map((childId) => renderSqlNode(childId, tree, schema)).filter(Boolean);
    if (parts.length === 0) {
      return "";
    }

    return parts.length === 1 ? parts[0] : `(${parts.join(` ${node.combinator} `)})`;
  }

  const field = getField(schema, node.field);
  if (!field) {
    return "";
  }

  const identifier = escapeIdentifier(node.field);
  return renderSqlRule(identifier, node.operator, node.value);
}

function renderSqlRule(field: string, operator: Operator, value: RuleValue) {
  switch (operator) {
    case "equals":
      return `${field} = ${formatSqlValue(value)}`;
    case "notEquals":
      return `${field} != ${formatSqlValue(value)}`;
    case "contains":
      return `${field} LIKE ${formatSqlValue(`%${value}%`)}`;
    case "startsWith":
      return `${field} LIKE ${formatSqlValue(`${value}%`)}`;
    case "greaterThan":
    case "after":
      return `${field} > ${formatSqlValue(value)}`;
    case "lessThan":
    case "before":
      return `${field} < ${formatSqlValue(value)}`;
    case "inArray":
      return `${field} IN (${Array.isArray(value) ? value.map(formatSqlValue).join(", ") : formatSqlValue(value)})`;
    case "between": {
      const [start, end] = Array.isArray(value) ? value : ["", ""];
      return `${field} BETWEEN ${formatSqlValue(start)} AND ${formatSqlValue(end)}`;
    }
    case "regex":
      return `${field} REGEXP ${formatSqlValue(value)}`;
    case "isNull":
      return `${field} IS NULL`;
    case "isNotNull":
      return `${field} IS NOT NULL`;
  }
}

function renderMongoNode(nodeId: string, tree: QueryTree, schema: SchemaDefinition): unknown {
  const node = tree.nodes[nodeId];
  if (!node) {
    return null;
  }

  if (node.type === "group") {
    const parts = node.children.map((childId) => renderMongoNode(childId, tree, schema)).filter(Boolean);
    if (parts.length === 0) {
      return {};
    }

    const key = node.combinator === "AND" ? "$and" : "$or";
    return parts.length === 1 ? parts[0] : { [key]: parts };
  }

  return renderMongoRule(node);
}

function renderMongoRule(rule: RuleNode) {
  const field = rule.field;
  switch (rule.operator) {
    case "equals":
      return { [field]: rule.value };
    case "notEquals":
      return { [field]: { $ne: rule.value } };
    case "contains":
      return { [field]: { $regex: escapeRegex(String(rule.value)), $options: "i" } };
    case "startsWith":
      return { [field]: { $regex: `^${escapeRegex(String(rule.value))}`, $options: "i" } };
    case "greaterThan":
    case "after":
      return { [field]: { $gt: rule.value } };
    case "lessThan":
    case "before":
      return { [field]: { $lt: rule.value } };
    case "inArray":
      return { [field]: { $in: Array.isArray(rule.value) ? rule.value : [rule.value] } };
    case "between": {
      const [start, end] = Array.isArray(rule.value) ? rule.value : ["", ""];
      return { [field]: { $gte: start, $lte: end } };
    }
    case "regex":
      return { [field]: { $regex: String(rule.value), $options: "i" } };
    case "isNull":
      return { [field]: null };
    case "isNotNull":
      return { [field]: { $ne: null } };
  }
}

function renderGraphqlNode(nodeId: string, tree: QueryTree, schema: SchemaDefinition): unknown {
  const node = tree.nodes[nodeId];
  if (!node) {
    return null;
  }

  if (node.type === "group") {
    const parts = node.children.map((childId) => renderGraphqlNode(childId, tree, schema)).filter(Boolean);
    const key = node.combinator === "AND" ? "and" : "or";
    return parts.length <= 1 ? parts[0] ?? {} : { [key]: parts };
  }

  const operator = getOperatorDefinition(node.operator);
  const suffix = operator ? graphqlOperatorKey(node.operator) : "eq";
  return { [node.field]: { [suffix]: node.value } };
}

function graphqlOperatorKey(operator: Operator) {
  const map: Record<Operator, string> = {
    equals: "eq",
    notEquals: "neq",
    contains: "contains",
    startsWith: "startsWith",
    greaterThan: "gt",
    lessThan: "lt",
    inArray: "in",
    between: "between",
    regex: "regex",
    isNull: "isNull",
    isNotNull: "isNotNull",
    before: "before",
    after: "after"
  };
  return map[operator];
}

function formatSqlValue(value: RuleValue | string | number) {
  if (typeof value === "number") {
    return String(value);
  }

  if (typeof value === "boolean") {
    return value ? "TRUE" : "FALSE";
  }

  if (value === null) {
    return "NULL";
  }

  return `'${String(value).replaceAll("'", "''")}'`;
}

function escapeIdentifier(value: string) {
  return value.replace(/[^a-zA-Z0-9_]/g, "");
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toGraphqlInput(value: unknown, indent = 2): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => toGraphqlInput(item, indent)).join(", ")}]`;
  }

  if (value && typeof value === "object") {
    const padding = " ".repeat(indent);
    const entries = Object.entries(value)
      .map(([key, child]) => `${padding}${key}: ${toGraphqlInput(child, indent + 2)}`)
      .join("\n");
    return `{\n${entries}\n${" ".repeat(indent - 2)}}`;
  }

  return JSON.stringify(value);
}

function pascalCase(value: string) {
  return value.replace(/(^|_)([a-z])/g, (_, __, character: string) => character.toUpperCase());
}
