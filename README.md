# Visual Query Builder

A schema-driven visual query builder built with Next.js App Router and TypeScript. It supports recursive condition groups, live SQL/Mongo/GraphQL previews, simulated execution against mock datasets, saved presets, history, JSON import/export, theme switching, keyboard shortcuts, and drag-and-drop sibling reordering.

## Running Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Architecture

- `src/lib/query/types.ts` defines the typed query domain: schemas, rules, groups, snapshots, previews, and execution state.
- `src/lib/query/tree.ts` owns normalized immutable tree updates. Every rule or group lives in `nodes`, while group `children` arrays define recursive structure.
- `src/lib/query/validation.ts` validates field/operator compatibility, empty groups, invalid ranges, invalid regex, missing references, and malformed imported JSON.
- `src/lib/query/generate.ts` traverses the same tree recursively to generate SQL-like, Mongo-style, and GraphQL filter previews.
- `src/lib/query/execute.ts` evaluates the tree recursively against schema-owned mock datasets.
- `src/lib/query/store.ts` wraps the pure tree helpers in Zustand so UI components stay isolated and updates remain predictable.

## Recursive Rendering Strategy

`GroupNodeView` renders itself and then recursively renders each child group or rule. Each group owns a local `SortableContext`, so deeply nested structures remain reorderable without flattening the UI. Collapsed groups keep their tree state intact while skipping child rendering.

## State Management Decisions

The query is normalized instead of nested by value:

```ts
{
  rootId: "group-root",
  nodes: {
    "group-root": { type: "group", children: ["rule-1", "group-2"] },
    "rule-1": { type: "rule", field: "age", operator: "greaterThan", value: 18 }
  }
}
```

This keeps add, remove, reorder, import, export, validation, and preview generation scalable for deep trees.

## Query Engine Design

The engine uses one canonical tree and separate recursive traversals for each concern:

- validation traversal catches invalid structure and values before execution
- preview traversal renders SQL, Mongo, or GraphQL without mutating state
- execution traversal evaluates each rule and combines group results with `AND` or `OR`

Generated SQL values are escaped, identifiers are sanitized, regex imports are validated, and imported JSON is structurally checked before entering the store.

## Performance

- normalized tree updates avoid cloning unrelated branches
- `useMemo` derives validation maps and sorted result pages
- recursive components are memoized and keyed by stable node ids
- DnD scopes are local to each group instead of one large flat sortable list
- pagination limits visible result rows while preserving full result counts

## Advanced Interactions

- Drag-and-drop reordering for sibling rules and groups
- Collapsible nested groups
- Query history after execution
- Saved query presets in `localStorage`
- Export/import query JSON with validation
- Dark/light mode
- Keyboard shortcuts: `Ctrl+Enter` adds a root rule, `Ctrl+Shift+Enter` adds a root group, `Ctrl+R` executes, `Ctrl+S` saves a preset
- Animated hover, focus, collapse, and drag transitions

## Testing

```bash
npm run test
```

Coverage focuses on query generation, recursive rendering, validation, execution, and immutable tree update behavior.

## Deployment

The repo includes:

- `vercel.json` for Vercel framework detection and build configuration
- `.github/workflows/ci.yml` for pull request tests and builds
- `.github/workflows/vercel.yml` for Vercel preview deployments on pull requests and production deployments from `main`

Required GitHub secrets:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

## Suggested PR Plan

1. Project scaffold and App Router setup
2. Query type system and schema catalog
3. Immutable normalized tree state helpers
4. Validation, generation, and execution engines
5. Recursive builder UI and schema-aware inputs
6. DnD, history, presets, import/export, and theme controls
7. Tests, documentation, CI, and Vercel deployment workflow

## Trade-offs

- Reordering is scoped to siblings inside the same group to keep drag behavior predictable for deeply nested trees.
- Mock datasets are intentionally compact for review clarity, but schemas and records can be extended without changing the builder architecture.
- Presets and history use `localStorage`; a production app would likely sync these to an authenticated backend.
