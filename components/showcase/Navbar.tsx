"use client";

import Link from "next/link";
import { DiveLogo } from "./DiveLogo";

export function Navbar() {
  return (
    <header className="fixed top-0 w-full z-[100] border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-black/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group transition-transform active:scale-95">
          <DiveLogo className="w-8 h-8 group-hover:rotate-[15deg] transition-transform duration-300" />
          <span className="font-black text-xl tracking-tighter">DIVE UI</span>
        </Link>

        <nav className="flex items-center gap-6">
          <Link href="/docs" className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400">
            Components
          </Link>
          <a href="https://github.com/hariharen9" target="_blank" className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100">
            GitHub
          </a>
        </nav>
      </div>
    </header>
  );
}
