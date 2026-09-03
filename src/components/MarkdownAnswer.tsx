"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Renders a data agent's answer.
 *
 * Agents reply in markdown — bold figures, grouped bullets, and often tables —
 * so rendering it as plain text throws away the structure that makes a numeric
 * answer readable.
 *
 * react-markdown builds React elements rather than setting innerHTML, and raw
 * HTML is not enabled. That matters here: the text is model-generated over
 * client data, and it should never be able to inject markup into the page.
 */
export function MarkdownAnswer({ children }: { children: string }) {
  return (
    <div className="text-[14px] leading-relaxed text-ink">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => (
            <p className="mb-3 last:mb-0">{children}</p>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-ink">{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          ul: ({ children }) => (
            <ul className="mb-3 space-y-1.5 last:mb-0">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-3 list-decimal space-y-1.5 pl-5 last:mb-0">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="relative pl-4 marker:text-peak-400 [ol>&]:pl-0">
              <span
                aria-hidden
                className="absolute left-0 top-[9px] h-1 w-1 rounded-full bg-peak-400 [ol>&]:hidden"
              />
              {children}
            </li>
          ),
          h1: ({ children }) => (
            <h3 className="mb-2 mt-4 text-sm font-semibold text-ink first:mt-0">
              {children}
            </h3>
          ),
          h2: ({ children }) => (
            <h3 className="mb-2 mt-4 text-sm font-semibold text-ink first:mt-0">
              {children}
            </h3>
          ),
          h3: ({ children }) => (
            <h4 className="mb-2 mt-4 text-sm font-semibold text-ink first:mt-0">
              {children}
            </h4>
          ),
          // Wide results are common; let the table scroll rather than
          // stretching the column it sits in.
          table: ({ children }) => (
            <div className="mb-3 overflow-x-auto rounded-lg border border-hairline last:mb-0">
              <table className="w-full border-collapse text-[13px]">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-surface-sunken">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="border-b border-hairline px-3 py-2 text-left font-semibold text-ink">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-b border-hairline px-3 py-2 text-ink-muted last:border-0">
              {children}
            </td>
          ),
          code: ({ children }) => (
            <code className="rounded bg-surface-sunken px-1.5 py-0.5 font-mono text-[12px] text-peak-700">
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre className="mb-3 overflow-x-auto rounded-lg bg-peak-950 p-3 font-mono text-[12px] leading-relaxed text-peak-100 last:mb-0">
              {children}
            </pre>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer noopener"
              className="text-peak-600 underline underline-offset-2"
            >
              {children}
            </a>
          ),
          hr: () => <hr className="my-4 border-hairline" />,
          blockquote: ({ children }) => (
            <blockquote className="mb-3 border-l-2 border-peak-300 pl-3 text-ink-muted last:mb-0">
              {children}
            </blockquote>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
