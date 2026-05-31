import { describe, expect, it } from "vitest";
import { SCHEMAS } from "./schemas";
import { addGroup, addRule, createInitialTree, moveChild, removeNode } from "./tree";

describe("query tree updates", () => {
  it("adds and removes nested nodes immutably", () => {
    const schema = SCHEMAS[0];
    const tree = createInitialTree(schema);
    const withRule = addRule(tree, schema, tree.rootId);
    const withGroup = addGroup(withRule, schema, withRule.rootId);

    expect(tree.nodes).not.toBe(withRule.nodes);
    expect(Object.keys(withGroup.nodes).length).toBeGreaterThan(Object.keys(tree.nodes).length);

    const nestedGroupId = Object.values(withGroup.nodes).find((node) => node.type === "group" && node.id !== withGroup.rootId)?.id;
    const removed = removeNode(withGroup, nestedGroupId ?? "");

    expect(removed.nodes[nestedGroupId ?? ""]).toBeUndefined();
  });

  it("reorders siblings within the same group", () => {
    const schema = SCHEMAS[0];
    const initialTree = createInitialTree(schema);
    const tree = addRule(initialTree, schema, initialTree.rootId);
    const root = tree.nodes[tree.rootId];

    if (root.type !== "group") {
      throw new Error("Expected root group");
    }

    const moved = moveChild(tree, root.id, root.children[0], root.children[2]);
    const movedRoot = moved.nodes[moved.rootId];

    expect(movedRoot.type === "group" ? movedRoot.children[2] : "").toBe(root.children[0]);
  });
});
