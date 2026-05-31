"use client";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { QueryBuilderApp } from "./query-builder-app";

describe("QueryBuilderApp", () => {
  beforeEach(() => {
    window.localStorage.clear();
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

  it("switches preview formats", async () => {
    const user = userEvent.setup();
    render(<QueryBuilderApp />);

    await user.click(screen.getByRole("button", { name: "Mongo" }));

    expect(screen.getByText(/\$and/)).toBeInTheDocument();
  });
});
