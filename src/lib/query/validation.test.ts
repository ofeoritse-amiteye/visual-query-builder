import { describe, expect, it } from "vitest";
import { SCHEMAS } from "./schemas";
import { createGroup, createInitialTree, updateRule } from "./tree";
import { validateImportedTree, validateTree } from "./validation";

describe("query validation", () => {
  it("rejects incompatible operators", () => {
    const schema = SCHEMAS[0];
    const tree = createInitialTree(schema);
    const ruleId = Object.values(tree.nodes).find((node) => node.type === "rule" && node.field === "age")?.id;
    const invalidTree = updateRule(tree, schema, ruleId ?? "", { operator: "contains" });

    expect(validateTree(invalidTree, schema).some((issue) => issue.message.includes("cannot be used"))).toBe(true);
  });

  it("rejects malformed imported trees", () => {
    const result = validateImportedTree({ rootId: "group-1", nodes: { "group-1": { id: "group-1", type: "group", combinator: "AND", children: ["missing"] } } }, SCHEMAS[0]);

    expect(result.ok).toBe(false);
  });

  it("flags empty nested groups", () => {
    const schema = SCHEMAS[0];
    const emptyGroup = createGroup("OR", []);
    const tree = {
      rootId: emptyGroup.id,
      nodes: {
        [emptyGroup.id]: emptyGroup
      }
    };

    expect(validateTree(tree, schema).some((issue) => issue.message.includes("at least one condition"))).toBe(true);
  });

  it("rejects invalid regex patterns", () => {
    const schema = SCHEMAS[0];
    const tree = createInitialTree(schema);
    const ruleId = Object.values(tree.nodes).find((node) => node.type === "rule")?.id ?? "";
    const withNameField = updateRule(tree, schema, ruleId, { field: "name" });
    const withRegexOperator = updateRule(withNameField, schema, ruleId, { operator: "regex" });
    const invalidTree = updateRule(withRegexOperator, schema, ruleId, { value: "[unclosed" });

    expect(validateTree(invalidTree, schema).some((issue) => issue.message.includes("Regex pattern is invalid"))).toBe(true);
  });

  it("rejects inverted date ranges", () => {
    const schema = SCHEMAS[0];
    const tree = createInitialTree(schema);
    const ruleId = Object.values(tree.nodes).find((node) => node.type === "rule")?.id ?? "";
    const withDateField = updateRule(tree, schema, ruleId, { field: "createdAt" });
    const withBetweenOperator = updateRule(withDateField, schema, ruleId, { operator: "between" });
    const invalidTree = updateRule(withBetweenOperator, schema, ruleId, { value: ["2026-12-31", "2026-01-01"] });

    expect(validateTree(invalidTree, schema).some((issue) => issue.message.includes("Range start must be before"))).toBe(true);
  });

  it("accepts valid imported trees", () => {
    const schema = SCHEMAS[0];
    const tree = createInitialTree(schema);
    const result = validateImportedTree(tree, schema);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.tree.rootId).toBe(tree.rootId);
      expect(Object.keys(result.tree.nodes).length).toBeGreaterThan(2);
    }
  });
});
