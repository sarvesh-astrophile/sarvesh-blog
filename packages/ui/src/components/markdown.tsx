"use client";

import type { ComponentProps } from "react";
import { Streamdown, useIsCodeFenceIncomplete, type ExtraProps } from "streamdown";
import { cn } from "cn";

import {
  CodeBlock,
  CodeBlockActions,
  CodeBlockContent,
  CodeBlockCopyButton,
  CodeBlockHeader,
  CodeBlockLine,
  CodeBlockTitle,
} from "@sarvesh-blog/ui/components/code-block";
import { useHighlightedCode } from "@sarvesh-blog/ui/hooks/use-highlighted-code";

function MarkdownCodeBlock({ code, language }: { code: string; language: string }) {
  const incomplete = useIsCodeFenceIncomplete();
  const lines = useHighlightedCode(code, language);

  return (
    <CodeBlock size="sm">
      <CodeBlockHeader>
        <CodeBlockTitle>{language || "text"}</CodeBlockTitle>
        <CodeBlockActions>
          <CodeBlockCopyButton value={code} disabled={incomplete} />
        </CodeBlockActions>
      </CodeBlockHeader>
      <CodeBlockContent lineNumbers className="max-h-80">
        {lines.map((line, index) => (
          <CodeBlockLine key={index}>{line}</CodeBlockLine>
        ))}
      </CodeBlockContent>
    </CodeBlock>
  );
}

function MarkdownCode({
  node: _node,
  className,
  children,
  ...props
}: ComponentProps<"code"> & ExtraProps) {
  if (!("data-block" in props)) {
    return (
      <code className="rounded-sm bg-muted px-1 py-0.5 font-mono text-[0.9em]" {...props}>
        {children}
      </code>
    );
  }

  return (
    <MarkdownCodeBlock
      code={typeof children === "string" ? children : ""}
      language={/language-(\S+)/.exec(className ?? "")?.[1] ?? ""}
    />
  );
}

const components = { code: MarkdownCode };

export function Markdown({
  children,
  isAnimating = false,
  className,
}: {
  children: string;
  isAnimating?: boolean;
  className?: string;
}) {
  return (
    <Streamdown
      className={cn("min-w-0 text-sm leading-relaxed", className)}
      components={components}
      controls={false}
      isAnimating={isAnimating}
      skipHtml
    >
      {children}
    </Streamdown>
  );
}
