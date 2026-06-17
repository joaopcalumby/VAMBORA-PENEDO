"use client";

import Link from "next/link";
import { Bus, Sailboat, ChevronRight } from "lucide-react";

import type { LineSummary } from "@/lib/types";
import { MODAL_LABEL } from "@/lib/format";
import { cn } from "@/lib/utils";

const ICONS: Record<string, typeof Bus> = {
  bus: Bus,
  van: Bus,
  ferry: Sailboat,
};

export function LineCard({ line }: { line: LineSummary }) {
  const Icon = ICONS[line.modal] ?? Bus;
  const modalLabel = MODAL_LABEL[line.modal] ?? line.modal;

  return (
    <Link
      href={`/linha/${line.id}`}
      className={cn(
        "flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:bg-accent/40 min-h-[64px]"
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="rounded-md bg-primary-50 p-2 text-primary-700 dark:bg-primary-900 dark:text-primary-200 shrink-0">
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              {modalLabel}
            </span>
            <span className="text-xs rounded bg-primary-100 px-1.5 py-0.5 text-primary-800">
              {line.number}
            </span>
          </div>
          <p className="font-medium truncate" title={line.name}>{line.name}</p>
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden />
    </Link>
  );
}
