import { describe, expect, it } from "vitest";
import { generateGraphql, generateMongo, generateSql } from "./generate";
import { SCHEMAS } from "./schemas";
import { createInitialTree } from "./tree";

describe("query generation", () => {
  it("generates SQL from the normalized query tree", () => {
    const schema = SCHEMAS[0];
    const tree = createInitialTree(schema);

    expect(generateSql(tree, schema)).toContain("SELECT * FROM users");
    expect(generateSql(tree, schema)).toContain("age > 18");
    expect(generateSql(tree, schema)).toContain("status = 'active'");
  });

  it("generates mongo logical groups", () => {
    const schema = SCHEMAS[0];
    const tree = createInitialTree(schema);

    expect(JSON.parse(generateMongo(tree, schema))).toEqual({
      $and: [{ age: { $gt: 18 } }, { status: "active" }]
    });
  });

  it("generates GraphQL filter syntax", () => {
    const schema = SCHEMAS[0];
    const tree = createInitialTree(schema);
    const output = generateGraphql(tree, schema);

    expect(output).toContain("query UsersQuery");
    expect(output).toContain("users(filter:");
    expect(output).toContain("age:");
    expect(output).toContain("gt: 18");
    expect(output).toContain("status:");
    expect(output).toContain("eq: \"active\"");
  });
});
