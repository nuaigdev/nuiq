"use client";

import { Check, Copy } from "lucide-react";
import { Children, isValidElement, useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/cn";

/**
 * Renders a data agent's answer.
 *
 * Agents reply in markdown — bold figures, grouped bullets, and very often
 * tables — so rendering it as plain text throws away the structure that makes a
 * numeric answer readable.
 *
 * react-markdown builds React elements rather than setting innerHTML, and raw
 * HTML stays disabled. That matters here: the text is model-generated over
 * client data and must never be able to inject markup into the page.
 */

/** Pull the plain source back out of a highlighted block, for the copy button. */
function toText(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(toText).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) return toText(node.props.children);
  return "";
}

function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(code);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1500);
        } catch {
          // Clipboard access can be refused outright; the query is still
          // selectable by hand, so say nothing rather than raise an alarm.
        }
      }}
      aria-label={copied ? "Copied" : "Copy code"}
      className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium text-peak-200/70 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peak-300"
    >
      {copied ? (
        <Check aria-hidden className="h-3.5 w-3.5" />
      ) : (
        <Copy aria-hidden className="h-3.5 w-3.5" />
      )}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

/**
 * Code is dark whatever the surrounding page is doing. A SQL fragment is quoted
 * machine output, not more prose, and giving it its own ground says so before a
 * word of it is read.
 */
function CodeBlock({ children }: { children: ReactNode }) {
  const child = Children.toArray(children)[0];
  let language = "";
  let source = "";

  if (isValidElement<{ className?: string; children?: ReactNode }>(child)) {
    language = /language-([\w-]+)/.exec(child.props.className ?? "")?.[1] ?? "";
    source = toText(child.props.children);
  }

  return (
    <div className="mb-4 overflow-hidden rounded-xl border border-peak-900 bg-peak-950 last:mb-0">
      <div className="flex items-center justify-between border-b border-white/[0.08] px-3 py-1.5">
        <span className="font-mono text-[11px] text-peak-300/80">
          {language || "text"}
        </span>
        <CopyButton code={source} />
      </div>
      <pre className="agent-code overflow-x-auto px-4 py-3 font-mono text-[12.5px] leading-relaxed">
        {children}
      </pre>
    </div>
  );
}

export function AnswerMarkdown({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "text-[15px] leading-[1.75] text-ink [&_>_*:first-child]:mt-0",
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeHighlight, { detect: true, ignoreMissing: true }]]}
        components={{
          p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
          strong: ({ children }) => (
            // Figures usually arrive bolded, so this is the weight a reader's
            // eye lands on first. Worth a shade more contrast than body text.
            <strong className="font-semibold text-ink">{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          del: ({ children }) => (
            <del className="text-ink-subtle line-through">{children}</del>
          ),

          h1: ({ children }) => (
            <h3 className="mb-2 mt-6 text-[15px] font-semibold tracking-tight text-ink first:mt-0">
              {children}
            </h3>
          ),
          h2: ({ children }) => (
            <h3 className="mb-2 mt-6 text-[15px] font-semibold tracking-tight text-ink first:mt-0">
              {children}
            </h3>
          ),
          h3: ({ children }) => (
            <h4 className="mb-2 mt-5 text-[14px] font-semibold tracking-tight text-ink first:mt-0">
              {children}
            </h4>
          ),
          h4: ({ children }) => (
            <h5 className="mb-2 mt-5 text-[13.5px] font-semibold text-ink-muted first:mt-0">
              {children}
            </h5>
          ),

          ul: ({ children }) => (
            <ul className="mb-4 space-y-2 last:mb-0">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-4 list-decimal space-y-2 pl-5 marker:text-ink-subtle marker:tabular-nums last:mb-0">
              {children}
            </ol>
          ),
          li: ({ children, className }) => {
            // Task lists carry their own checkbox; a second bullet beside it
            // reads as a rendering mistake.
            const isTask = (className ?? "").includes("task-list-item");
            return (
              <li
                className={cn(
                  "relative",
                  isTask ? "list-none pl-0" : "pl-4 [ol_&]:pl-0",
                )}
              >
                {!isTask ? (
                  <span
                    aria-hidden
                    className="absolute left-0 top-[11px] h-[3px] w-[3px] rounded-full bg-peak-400 [ol_&]:hidden"
                  />
                ) : null}
                {children}
              </li>
            );
          },
          input: ({ checked, type }) =>
            type === "checkbox" ? (
              <input
                type="checkbox"
                checked={checked}
                readOnly
                className="mr-2 h-3.5 w-3.5 translate-y-[2px] accent-peak-600"
              />
            ) : null,

          // Wide results are the norm, not the exception. The table scrolls
          // inside its own frame so it can never widen the panel.
          table: ({ children }) => (
            <div className="mb-4 overflow-x-auto rounded-lg border border-agent-line last:mb-0">
              <table className="w-full border-collapse text-[13.5px] tabular-nums">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-agent-raised">{children}</thead>
          ),
          tr: ({ children }) => (
            <tr className="border-b border-agent-line last:border-0 even:bg-agent-raised/50">
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className="whitespace-nowrap px-3 py-2 text-left text-[12px] font-semibold text-ink-muted">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 align-top text-ink">{children}</td>
          ),

          code: ({ className, children }) =>
            // A fenced block arrives wrapped in <pre>, which supplies its own
            // chrome below; this only has to style the inline case.
            className?.startsWith("language-") || className?.includes("hljs") ? (
              <code className={className}>{children}</code>
            ) : (
              <code className="rounded-[5px] border border-agent-line bg-agent-raised px-[5px] py-[2px] font-mono text-[12.5px] text-peak-700">
                {children}
              </code>
            ),
          pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,

          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer noopener"
              className="font-medium text-peak-600 underline decoration-peak-300 underline-offset-[3px] transition-colors hover:text-peak-700 hover:decoration-peak-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peak-500"
            >
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote className="mb-4 border-l-2 border-peak-300 pl-4 text-ink-muted last:mb-0">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-6 border-agent-line" />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
