"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ExternalLink, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchTextFromIpfs, getIpfsGatewayUrl } from "@/lib/ipfs";
import { cn } from "@/lib/utils";

function renderInlineMarkdown(text: string) {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g).filter(Boolean);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }

    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={index}
          className="rounded bg-white/[0.06] px-1 py-0.5 text-[0.95em] text-primary"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    return <span key={index}>{part}</span>;
  });
}

export function renderMarkdownPreview(markdown: string) {
  const lines = markdown.split("\n");
  const elements: JSX.Element[] = [];
  let listItems: string[] = [];
  let paragraphLines: string[] = [];

  const flushParagraph = () => {
    if (paragraphLines.length === 0) return;

    elements.push(
      <p key={`p-${elements.length}`} className="leading-7 text-slate-200">
        {renderInlineMarkdown(paragraphLines.join(" "))}
      </p>
    );
    paragraphLines = [];
  };

  const flushList = () => {
    if (listItems.length === 0) return;

    elements.push(
      <ul
        key={`ul-${elements.length}`}
        className="list-disc space-y-1 pl-5 text-slate-200"
      >
        {listItems.map((item, index) => (
          <li key={`${elements.length}-${index}`}>{renderInlineMarkdown(item)}</li>
        ))}
      </ul>
    );
    listItems = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    if (line.startsWith("- ")) {
      flushParagraph();
      listItems.push(line.slice(2));
      continue;
    }

    flushList();

    if (line.startsWith("### ")) {
      flushParagraph();
      elements.push(
        <h3 key={`h3-${elements.length}`} className="text-lg font-semibold text-white">
          {renderInlineMarkdown(line.slice(4))}
        </h3>
      );
      continue;
    }

    if (line.startsWith("## ")) {
      flushParagraph();
      elements.push(
        <h2 key={`h2-${elements.length}`} className="text-xl font-semibold text-white">
          {renderInlineMarkdown(line.slice(3))}
        </h2>
      );
      continue;
    }

    if (line.startsWith("# ")) {
      flushParagraph();
      elements.push(
        <h1 key={`h1-${elements.length}`} className="text-2xl font-semibold text-white">
          {renderInlineMarkdown(line.slice(2))}
        </h1>
      );
      continue;
    }

    paragraphLines.push(line);
  }

  flushParagraph();
  flushList();

  if (elements.length === 0) {
    return <p className="text-sm text-slate-500">Nothing to preview yet.</p>;
  }

  return <div className="space-y-3 text-sm">{elements}</div>;
}

type MarkdownContractPreviewProps = {
  noteUri: string;
  title?: string;
  defaultOpen?: boolean;
  className?: string;
};

export default function MarkdownContractPreview({
  noteUri,
  title = "Contract Note",
  defaultOpen = false,
  className,
}: MarkdownContractPreviewProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(defaultOpen);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || content !== null) {
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const markdown = await fetchTextFromIpfs(noteUri);
        if (!cancelled) {
          setContent(markdown);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : "Failed to load note"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [content, noteUri, open]);

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className={cn(
        "rounded-2xl border border-white/[0.06] bg-black/20",
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03]">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-white">{title}</div>
            <div className="truncate text-xs text-slate-500">{noteUri}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="rounded-xl border-white/[0.08] bg-white/[0.03]"
          >
            <a
              href={getIpfsGatewayUrl(noteUri)}
              target="_blank"
              rel="noreferrer"
            >
              Open Raw <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
            </a>
          </Button>

          <CollapsibleTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl border-white/[0.08] bg-white/[0.03]"
            >
              {open ? "Hide" : "Preview"}
              <ChevronDown
                className={cn(
                  "ml-1.5 h-3.5 w-3.5 transition-transform",
                  open && "rotate-180"
                )}
              />
            </Button>
          </CollapsibleTrigger>
        </div>
      </div>

      <CollapsibleContent className="border-t border-white/[0.06]">
        <div className="px-4 py-4">
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-5 w-1/3 bg-white/[0.04]" />
              <Skeleton className="h-4 w-full bg-white/[0.04]" />
              <Skeleton className="h-4 w-5/6 bg-white/[0.04]" />
              <Skeleton className="h-4 w-2/3 bg-white/[0.04]" />
            </div>
          ) : error ? (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
              {error}
            </div>
          ) : (
            renderMarkdownPreview(content ?? "")
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
