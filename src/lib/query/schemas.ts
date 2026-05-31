import type { SchemaDefinition } from "./types";

export const SCHEMAS: SchemaDefinition[] = [
  {
    id: "users",
    label: "Users",
    tableName: "users",
    fields: [
      { key: "name", label: "Name", type: "string" },
      { key: "age", label: "Age", type: "number" },
      { key: "country", label: "Country", type: "enum", options: ["Nigeria", "Ghana", "Kenya", "Canada", "United Kingdom"] },
      { key: "status", label: "Status", type: "enum", options: ["active", "trial", "paused", "blocked"] },
      { key: "purchases", label: "Purchases", type: "number" },
      { key: "createdAt", label: "Created at", type: "date" },
      { key: "verified", label: "Verified", type: "boolean" }
    ],
    dataset: [
      { name: "Ada Okafor", age: 28, country: "Nigeria", status: "active", purchases: 16, createdAt: "2026-01-12", verified: true },
      { name: "Kwame Mensah", age: 34, country: "Ghana", status: "trial", purchases: 4, createdAt: "2026-02-19", verified: false },
      { name: "Amina Bello", age: 22, country: "Nigeria", status: "active", purchases: 11, createdAt: "2025-11-30", verified: true },
      { name: "Grace Wanjiku", age: 19, country: "Kenya", status: "paused", purchases: 2, createdAt: "2026-03-07", verified: false },
      { name: "Noah Smith", age: 41, country: "Canada", status: "blocked", purchases: 27, createdAt: "2024-09-15", verified: true },
      { name: "Lola Adeyemi", age: 31, country: "Nigeria", status: "active", purchases: 42, createdAt: "2026-04-26", verified: true },
      { name: "Eleanor Brooks", age: 25, country: "United Kingdom", status: "trial", purchases: 7, createdAt: "2026-05-04", verified: false },
      { name: "Tunde Balogun", age: 17, country: "Nigeria", status: "paused", purchases: 0, createdAt: "2026-05-12", verified: false }
    ]
  },
  {
    id: "orders",
    label: "Orders",
    tableName: "orders",
    fields: [
      { key: "orderId", label: "Order ID", type: "string" },
      { key: "total", label: "Total", type: "number" },
      { key: "channel", label: "Channel", type: "enum", options: ["web", "mobile", "partner", "admin"] },
      { key: "fulfillment", label: "Fulfillment", type: "enum", options: ["pending", "packed", "shipped", "delivered", "returned"] },
      { key: "orderedAt", label: "Ordered at", type: "date" },
      { key: "priority", label: "Priority", type: "boolean" }
    ],
    dataset: [
      { orderId: "ORD-1082", total: 240, channel: "web", fulfillment: "delivered", orderedAt: "2026-01-04", priority: false },
      { orderId: "ORD-1139", total: 1800, channel: "partner", fulfillment: "shipped", orderedAt: "2026-03-18", priority: true },
      { orderId: "ORD-1201", total: 64, channel: "mobile", fulfillment: "pending", orderedAt: "2026-05-15", priority: false },
      { orderId: "ORD-1238", total: 920, channel: "admin", fulfillment: "packed", orderedAt: "2026-05-22", priority: true },
      { orderId: "ORD-1289", total: 120, channel: "web", fulfillment: "returned", orderedAt: "2025-12-09", priority: false }
    ]
  }
];

export function getSchema(schemaId: string) {
  return SCHEMAS.find((schema) => schema.id === schemaId) ?? SCHEMAS[0];
}
