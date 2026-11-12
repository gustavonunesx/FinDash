import { Children, type ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

function textoDe(children: ReactNode): string {
  return Children.toArray(children)
    .map((c) => (typeof c === "string" || typeof c === "number" ? String(c) : ""))
    .join("")
    .trim();
}

const ehValor = (children: ReactNode) => /^[-+()\sR$\d.,%x]+$/.test(textoDe(children)) && /\d/.test(textoDe(children));

const componentes: Components = {
  p: ({ children }) => <p className="mb-3 leading-relaxed last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="mb-3 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>,
  ol: ({ children }) => <ol className="mb-3 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>,
  strong: ({ children }) => <strong className="font-bold">{children}</strong>,
  h1: ({ children }) => <h3 className="mb-2 mt-4 text-base font-extrabold first:mt-0">{children}</h3>,
  h2: ({ children }) => <h3 className="mb-2 mt-4 text-base font-extrabold first:mt-0">{children}</h3>,
  h3: ({ children }) => <h4 className="mb-2 mt-3 text-sm font-extrabold first:mt-0">{children}</h4>,
  hr: () => <hr className="my-4 border-border" />,
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="font-semibold text-fd-blue underline">
      {children}
    </a>
  ),
  code: ({ children }) => <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]">{children}</code>,
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto rounded-xl border border-border">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-muted/60">{children}</thead>,
  th: ({ children }) => (
    <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-muted-foreground">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className={cn("border-t border-border px-3 py-2 align-top", ehValor(children) && "font-mono tabular-nums")}>
      {children}
    </td>
  ),
};

export function MarkdownResposta({ texto }: { texto: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={componentes}>
      {texto}
    </ReactMarkdown>
  );
}
