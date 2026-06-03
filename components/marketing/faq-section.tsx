"use client";

import { useState } from "react";
import { IconChevronDown } from "@tabler/icons-react";
import { faqItems } from "@/lib/site-config";
import { cn } from "@/lib/utils";

export function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="border-t border-border/40 py-24">
      <div className="mx-auto max-w-2xl px-6">
        <h2 className="text-center text-3xl font-bold">Perguntas frequentes</h2>
        <div className="mt-10 space-y-3">
          {faqItems.map((item, i) => (
            <div key={item.q} className="rounded-xl border border-border/60 bg-card/50">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span className="font-medium">{item.q}</span>
                <IconChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                    open === i && "rotate-180"
                  )}
                />
              </button>
              {open === i && (
                <p className="border-t border-border/40 px-5 py-4 text-sm text-muted-foreground">
                  {item.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
