import { describe, expect, it } from "vitest";
import { executeQuery } from "./execute";
import { SCHEMAS } from "./schemas";
import { createInitialTree } from "./tree";

describe("query execution", () => {
  it("filters the mock dataset with nested tree logic", () => {
    const schema = SCHEMAS[0];
    const tree = createInitialTree(schema);
    const results = executeQuery(tree, schema);

    expect(results.every((record) => Number(record.age) > 18 && record.status === "active")).toBe(true);
    expect(results.length).toBeGreaterThan(0);
  });
});
