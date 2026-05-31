export type FieldType = "string" | "number" | "enum" | "date" | "boolean";

export type Operator =
  | "equals"
  | "notEquals"
  | "contains"
  | "startsWith"
  | "greaterThan"
  | "lessThan"
  | "inArray"
  | "between"
  | "regex"
  | "isNull"
  | "isNotNull"
  | "before"
  | "after";

export type LogicOperator = "AND" | "OR";

export type FieldDefinition = {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
};

export type RecordValue = string | number | boolean | null;
export type DataRecord = Record<string, RecordValue>;

export type SchemaDefinition = {
  id: string;
  label: string;
  tableName: string;
  fields: FieldDefinition[];
  dataset: DataRecord[];
};

export type RuleValue = string | number | boolean | null | Array<string | number>;

export type RuleNode = {
  id: string;
  type: "rule";
  field: string;
  operator: Operator;
  value: RuleValue;
};

export type GroupNode = {
  id: string;
  type: "group";
  combinator: LogicOperator;
  children: string[];
  collapsed?: boolean;
};

export type QueryNode = RuleNode | GroupNode;

export type QueryTree = {
  rootId: string;
  nodes: Record<string, QueryNode>;
};

export type QuerySnapshot = {
  id: string;
  name: string;
  schemaId: string;
  tree: QueryTree;
  createdAt: string;
};

export type ValidationIssue = {
  nodeId: string;
  message: string;
  severity: "error" | "warning";
};

export type PreviewFormat = "sql" | "mongo" | "graphql";

export type ExecutionState = {
  loading: boolean;
  page: number;
  pageSize: number;
  sortField: string;
  sortDirection: "asc" | "desc";
};
