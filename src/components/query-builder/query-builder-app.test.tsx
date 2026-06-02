"use client";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { useQueryStore } from "@/lib/query/store";
import { QueryBuilderApp } from "./query-builder-app";

describe("QueryBuilderApp", () => {
  beforeEach(() => {
    window.localStorage.clear();
    useQueryStore.setState({
      importError: null,
      presets: [],
      history: []
    });
  });

  it("renders recursive groups and adds nested conditions", async () => {
    const user = userEvent.setup();
    render(<QueryBuilderApp />);

    expect(screen.getByRole("heading", { name: "Visual Query Builder" })).toBeInTheDocument();
    expect(screen.getAllByTestId("group-node")).toHaveLength(1);

    await user.click(screen.getByLabelText("Add root group"));

    expect(screen.getAllByTestId("group-node").length).toBeGreaterThan(1);
    expect(screen.getAllByTestId("rule-node").length).toBeGreaterThan(2);
  });

  it("switches preview formats including GraphQL", async () => {
    const user = userEvent.setup();
    render(<QueryBuilderApp />);

    await user.click(screen.getByRole("button", { name: "Mongo" }));
    expect(screen.getByText(/\$and/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "GraphQL" }));
    expect(screen.getByText(/UsersQuery/)).toBeInTheDocument();
    expect(screen.getByText(/filter:/)).toBeInTheDocument();
  });

  it("saves a preset with the keyboard shortcut", async () => {
    render(<QueryBuilderApp />);

    fireEvent.keyDown(window, { key: "s", ctrlKey: true });

    await waitFor(() => {
      expect(useQueryStore.getState().presets.length).toBe(1);
    });
  });

  it("adds a root rule with Ctrl+Enter", async () => {
    render(<QueryBuilderApp />);
    const initialRules = screen.getAllByTestId("rule-node").length;

    fireEvent.keyDown(window, { key: "Enter", ctrlKey: true });

    await waitFor(() => {
      expect(screen.getAllByTestId("rule-node").length).toBe(initialRules + 1);
    });
  });

  it("shows import errors for invalid JSON files", async () => {
    const user = userEvent.setup();
    render(<QueryBuilderApp />);

    const file = new File(["not-json"], "bad-query.json", { type: "application/json" });
    await user.upload(screen.getByTestId("import-json-input"), file);

    await waitFor(() => {
      expect(screen.getByText("Imported file must be valid JSON.")).toBeInTheDocument();
    });
  });

  it("shows an empty results state for impossible filters", async () => {
    const user = userEvent.setup();
    render(<QueryBuilderApp />);

    const ageInput = screen.getAllByRole("spinbutton")[0];
    await user.clear(ageInput);
    await user.type(ageInput, "999");
    await user.click(screen.getByRole("button", { name: "Run" }));

    await waitFor(
      () => {
        expect(screen.getByText("No matching records")).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });
});
