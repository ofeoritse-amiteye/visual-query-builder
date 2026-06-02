"use client";

import { useEffect, useState, type ComponentType } from "react";
import { Database, Layers3, ListChecks, Workflow } from "lucide-react";

const MIN_SPLASH_MS = 3000;

export function QueryBuilderShell() {
  const [App, setApp] = useState<ComponentType | null>(null);
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    const splashTimer = window.setTimeout(() => setSplashDone(true), MIN_SPLASH_MS);

    void import("./query-builder-app").then((module) => {
      setApp(() => module.QueryBuilderApp);
    });

    return () => window.clearTimeout(splashTimer);
  }, []);

  if (!App || !splashDone) {
    return <BuilderLoading />;
  }

  return <App />;
}

function BuilderLoading() {
  const steps = [
    { label: "Loading schemas and datasets", delay: "0ms" },
    { label: "Initializing logic canvas", delay: "180ms" },
    { label: "Wiring preview and execution engine", delay: "360ms" }
  ];

  return (
    <main className="app-shell flex min-h-screen items-center justify-center px-4 py-10">
      <div className="top-shell builder-splash-card animate-panel-in mx-auto shrink-0 p-6 md:p-8">
        <div className="flex items-start gap-4">
          <div className="relative grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-accentSoft/40 bg-accent/10 text-accent shadow-sm">
            <span className="absolute inset-[-3px] rounded-[1.1rem] border-2 border-accent/15 border-t-accent animate-loader-orbit" aria-hidden="true" />
            <Workflow className="relative h-7 w-7 animate-pulse-soft" />
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="section-kicker">Recursive query studio</p>
            <h1 className="mt-1 text-xl font-black leading-tight text-ink md:text-2xl">Preparing your builder</h1>
            <p className="mt-2 text-sm leading-6 text-inkSoft">Setting up nested groups, live query preview, and mock execution.</p>
          </div>
        </div>

        <div className="builder-loader-track mt-7" role="progressbar" aria-label="Loading builder" aria-valuetext="In progress" />

        <ul className="mt-5 space-y-3">
          {steps.map((step) => (
            <li key={step.label} className="flex items-center gap-3 text-sm font-semibold text-inkSoft" style={{ animationDelay: step.delay }}>
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-border/80 bg-panel/80 text-accent animate-loader-step" style={{ animationDelay: step.delay }}>
                <ListChecks className="h-3.5 w-3.5" />
              </span>
              <span className="animate-loader-step min-w-0 flex-1" style={{ animationDelay: step.delay }}>
                {step.label}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-6 space-y-2.5" aria-hidden="true">
          <div className="builder-loader-skeleton animate-loader-shimmer w-full" />
          <div className="builder-loader-skeleton animate-loader-shimmer w-[92%]" style={{ animationDelay: "120ms" }} />
          <div className="builder-loader-skeleton animate-loader-shimmer w-[78%]" style={{ animationDelay: "240ms" }} />
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <span className="soft-chip" data-tone="accent">
            <ListChecks className="h-3.5 w-3.5" />
            Rules
          </span>
          <span className="soft-chip">
            <Layers3 className="h-3.5 w-3.5" />
            Groups
          </span>
          <span className="soft-chip">
            <Database className="h-3.5 w-3.5" />
            Results
          </span>
        </div>
      </div>
    </main>
  );
}
