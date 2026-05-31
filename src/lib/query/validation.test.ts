import { describe, expect, it } from "vitest";
import { SCHEMAS } from "./schemas";
import { createInitialTree, updateRule } from "./tree";
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
});
