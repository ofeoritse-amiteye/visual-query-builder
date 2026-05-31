import { getDefaultOperator, getDefaultValue, getOperatorsForField } from "./operators";
import type { FieldDefinition, GroupNode, LogicOperator, Operator, QueryTree, RuleNode, RuleValue, SchemaDefinition } from "./types";

let idCounter = 0;

export function createId(prefix: "group" | "rule" | "snapshot" = "rule") {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${idCounter.toString(36)}`;
}

export function cloneTree(tree: QueryTree): QueryTree {
  return {
    rootId: tree.rootId,
    nodes: Object.fromEntries(
      Object.entries(tree.nodes).map(([id, node]) => [
        id,
        node.type === "group" ? { ...node, children: [...node.children] } : { ...node, value: Array.isArray(node.value) ? [...node.value] : node.value }
      ])
    )
  };
}

export function createRule(schema: SchemaDefinition, fieldKey = schema.fields[0].key): RuleNode {
  const field = getField(schema, fieldKey) ?? schema.fields[0];
  const operator = getDefaultOperator(field);

  return {
    id: createId("rule"),
    type: "rule",
    field: field.key,
    operator,
    value: getDefaultValue(field, operator)
  };
}

export function createGroup(combinator: LogicOperator = "AND", children: string[] = []): GroupNode {
  return {
    id: createId("group"),
    type: "group",
    combinator,
    children,
    collapsed: false
  };
}

export function createInitialTree(schema: SchemaDefinition): QueryTree {
  const firstRule = createRule(schema, schema.fields.find((field) => field.key === "age")?.key ?? schema.fields[0].key);
  const secondRule = createRule(schema, schema.fields.find((field) => field.key === "status")?.key ?? schema.fields[0].key);
  const root = createGroup("AND", [firstRule.id, secondRule.id]);

  if (firstRule.field === "age") {
    firstRule.operator = "greaterThan";
    firstRule.value = 18;
  }

  if (secondRule.field === "status") {
    secondRule.operator = "equals";
    secondRule.value = "active";
  }

  return {
    rootId: root.id,
    nodes: {
      [root.id]: root,
      [firstRule.id]: firstRule,
      [secondRule.id]: secondRule
    }
  };
}

export function getField(schema: SchemaDefinition, fieldKey: string) {
  return schema.fields.find((field) => field.key === fieldKey);
}

export function addRule(tree: QueryTree, schema: SchemaDefinition, groupId: string): QueryTree {
  const group = tree.nodes[groupId];
  if (!group || group.type !== "group") {
    return tree;
  }

  const nextTree = cloneTree(tree);
  const nextRule = createRule(schema);
  const nextGroup = nextTree.nodes[groupId] as GroupNode;
  nextTree.nodes[nextRule.id] = nextRule;
  nextGroup.children.push(nextRule.id);
  nextGroup.collapsed = false;
  return nextTree;
}

export function addGroup(tree: QueryTree, schema: SchemaDefinition, parentId: string): QueryTree {
  const parent = tree.nodes[parentId];
  if (!parent || parent.type !== "group") {
    return tree;
  }

  const nextTree = cloneTree(tree);
  const childRule = createRule(schema);
  const childGroup = createGroup("AND", [childRule.id]);
  const nextParent = nextTree.nodes[parentId] as GroupNode;
  nextTree.nodes[childRule.id] = childRule;
  nextTree.nodes[childGroup.id] = childGroup;
  nextParent.children.push(childGroup.id);
  nextParent.collapsed = false;
  return nextTree;
}

export function updateGroup(tree: QueryTree, groupId: string, patch: Partial<Pick<GroupNode, "combinator" | "collapsed">>): QueryTree {
  const group = tree.nodes[groupId];
  if (!group || group.type !== "group") {
    return tree;
  }

  return {
    ...tree,
    nodes: {
      ...tree.nodes,
      [groupId]: { ...group, ...patch }
    }
  };
}

export function updateRule(tree: QueryTree, schema: SchemaDefinition, ruleId: string, patch: Partial<Pick<RuleNode, "field" | "operator" | "value">>): QueryTree {
  const rule = tree.nodes[ruleId];
  if (!rule || rule.type !== "rule") {
    return tree;
  }

  const nextRule: RuleNode = { ...rule, ...patch };

  if (patch.field && patch.field !== rule.field) {
    const field = getField(schema, patch.field);
    if (field) {
      const operator = getDefaultOperator(field);
      nextRule.operator = operator;
      nextRule.value = getDefaultValue(field, operator);
    }
  }

  if (patch.operator && patch.operator !== rule.operator) {
    const field = getField(schema, nextRule.field);
    if (field) {
      nextRule.value = getDefaultValue(field, patch.operator);
    }
  }

  return {
    ...tree,
    nodes: {
      ...tree.nodes,
      [ruleId]: nextRule
    }
  };
}

export function removeNode(tree: QueryTree, nodeId: string): QueryTree {
  if (nodeId === tree.rootId) {
    return tree;
  }

  const nextTree = cloneTree(tree);
  const idsToDelete = collectDescendantIds(nextTree, nodeId);
  idsToDelete.add(nodeId);

  Object.values(nextTree.nodes).forEach((node) => {
    if (node.type === "group") {
      node.children = node.children.filter((childId) => !idsToDelete.has(childId));
    }
  });

  idsToDelete.forEach((id) => {
    delete nextTree.nodes[id];
  });

  return nextTree;
}

export function moveChild(tree: QueryTree, parentId: string, activeId: string, overId: string): QueryTree {
  const parent = tree.nodes[parentId];
  if (!parent || parent.type !== "group" || activeId === overId) {
    return tree;
  }

  const oldIndex = parent.children.indexOf(activeId);
  const newIndex = parent.children.indexOf(overId);
  if (oldIndex < 0 || newIndex < 0) {
    return tree;
  }

  const children = [...parent.children];
  const [removed] = children.splice(oldIndex, 1);
  children.splice(newIndex, 0, removed);

  return {
    ...tree,
    nodes: {
      ...tree.nodes,
      [parentId]: { ...parent, children }
    }
  };
}

export function sanitizeRuleForSchema(rule: RuleNode, schema: SchemaDefinition): RuleNode {
  const field = getField(schema, rule.field) ?? schema.fields[0];
  const allowedOperators = getOperatorsForField(field).map((operator) => operator.id);
  const operator: Operator = allowedOperators.includes(rule.operator) ? rule.operator : getDefaultOperator(field);

  return {
    ...rule,
    field: field.key,
    operator,
    value: normalizeValueForField(field, operator, rule.value)
  };
}

function normalizeValueForField(field: FieldDefinition, operator: Operator, value: RuleValue): RuleValue {
  if (operator === "isNull" || operator === "isNotNull") {
    return null;
  }

  if (operator === "between") {
    return Array.isArray(value) && value.length >= 2 ? [coerceComparableValue(field, value[0]), coerceComparableValue(field, value[1])] : getDefaultValue(field, operator);
  }

  if (operator === "inArray") {
    return Array.isArray(value) ? value.map((item) => coerceComparableValue(field, item)) : getDefaultValue(field, operator);
  }

  return coerceSingleValue(field, value);
}

function coerceSingleValue(field: FieldDefinition, value: RuleValue | string | number): RuleValue {
  if (field.type === "number") {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : 0;
  }

  if (field.type === "boolean") {
    return value === true || value === "true";
  }

  if (field.type === "enum") {
    return field.options?.includes(String(value)) ? String(value) : field.options?.[0] ?? "";
  }

  return String(value ?? "");
}

function coerceComparableValue(field: FieldDefinition, value: string | number): string | number {
  const coerced = coerceSingleValue(field, value);
  return typeof coerced === "number" ? coerced : String(coerced ?? "");
}

function collectDescendantIds(tree: QueryTree, nodeId: string, ids = new Set<string>()) {
  const node = tree.nodes[nodeId];
  if (node?.type === "group") {
    node.children.forEach((childId) => {
      ids.add(childId);
      collectDescendantIds(tree, childId, ids);
    });
  }
  return ids;
}
