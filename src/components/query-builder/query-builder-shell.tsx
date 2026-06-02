"use client";

import dynamic from "next/dynamic";
import { Workflow } from "lucide-react";

const QueryBuilderApp = dynamic(() => import("./query-builder-app").then((module) => module.QueryBuilderApp), {
  ssr: false,
  loading: () => (
    <main className="app-shell grid min-h-screen place-items-center px-4 py-8">
      <div className="top-shell flex w-full max-w-md items-center gap-4 p-5">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg border border-accent/30 bg-accent/15 text-accent">
          <Workflow className="h-6 w-6" />
        </div>
        <div>
          <p className="section-kicker">Recursive query studio</p>
          <p className="mt-1 text-lg font-black text-ink">Preparing builder</p>
        </div>
      </div>
    </main>
  )
});

export function QueryBuilderShell() {
  return <QueryBuilderApp />;
}
