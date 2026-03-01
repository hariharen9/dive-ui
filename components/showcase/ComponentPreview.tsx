"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Terminal, Eye, Code2, Copy, Check } from "lucide-react";

interface ComponentPreviewProps {
  name: string;
  children: React.ReactNode;
  code?: string;
}

export function ComponentPreview({ name, children, code }: ComponentPreviewProps) {
  const [tab, setTab] = useState<"preview" | "code">("preview");
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative my-10 flex flex-col space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal size={16} className="text-zinc-500" />
          <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {name}
          </h3>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-zinc-200 dark:border-zinc-800 p-1 bg-white dark:bg-zinc-950">
          <button
            onClick={() => setTab("preview")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all",
              tab === "preview"
                ? "bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            )}
          >
            <Eye size={14} />
            Preview
          </button>
          <button
            onClick={() => setTab("code")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all",
              tab === "code"
                ? "bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            )}
          >
            <Code2 size={14} />
            Code
          </button>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 backdrop-blur-sm min-h-[400px] flex items-center justify-center">
        {tab === "preview" ? (
          <div className="w-full h-full p-10 flex items-center justify-center overflow-hidden">
            {children}
          </div>
        ) : (
          <div className="w-full h-full relative">
             <button 
                onClick={copyCode}
                className="absolute top-4 right-4 z-20 p-2 rounded-lg bg-zinc-900/50 hover:bg-zinc-900 text-white border border-white/10 transition-colors"
             >
                {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
             </button>
             <pre className="p-6 text-sm font-mono overflow-auto max-h-[600px] bg-zinc-950 text-zinc-300 custom-scrollbar">
                <code>{code || "// No code available"}</code>
             </pre>
          </div>
        )}
      </div>
    </div>
  );
}
