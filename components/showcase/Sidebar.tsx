"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { registry } from "@/registry";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();

  const categories = Array.from(
    new Set(Object.values(registry).map((item) => item.category))
  );

  return (
    <aside className="w-64 border-r border-zinc-200 dark:border-zinc-800 h-screen fixed left-0 top-0 pt-20 pb-10 overflow-y-auto bg-white dark:bg-black">
      <div className="px-6 space-y-8">
        {categories.map((category) => (
          <div key={category} className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 px-2">
              {category}
            </h4>
            <ul className="space-y-1">
              {Object.values(registry)
                .filter((item) => item.category === category)
                .map((item) => (
                  <li key={item.slug}>
                    <Link
                      href={`/docs/${item.slug}`}
                      className={cn(
                        "block px-3 py-2 text-sm rounded-lg transition-colors",
                        pathname === `/docs/${item.slug}`
                          ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium"
                          : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100"
                      )}
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>
    </aside>
  );
}
