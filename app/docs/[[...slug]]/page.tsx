import { notFound } from "next/navigation";
import { registry } from "@/registry";
import { ComponentPreview } from "@/components/showcase/ComponentPreview";
import fs from "fs";
import path from "path";

interface PageProps {
  params: Promise<{
    slug?: string[];
  }>;
}

export default async function ComponentPage({ params }: PageProps) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug?.[0];

  if (!slug) {
    // Redirect or show a welcome page
    return (
      <div className="space-y-6">
        <h1 className="text-4xl font-black tracking-tight">Components</h1>
        <p className="text-lg text-zinc-500 dark:text-zinc-400">
          Explore our collection of high-performance animated components.
        </p>
        <div className="grid grid-cols-2 gap-4">
           {Object.values(registry).map(item => (
              <a 
                key={item.slug}
                href={`/docs/${item.slug}`}
                className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 transition-colors group"
              >
                 <h3 className="font-bold mb-2 group-hover:text-blue-500">{item.name}</h3>
                 <p className="text-sm text-zinc-500 line-clamp-2">{item.description}</p>
              </a>
           ))}
        </div>
      </div>
    );
  }

  const componentData = registry[slug];

  if (!componentData) {
    notFound();
  }

  const { name, description, component: Component, props } = componentData;

  // Read source code
  let sourceCode = "";
  try {
    // Map slug to filename (this is a bit manual but works for now)
    const filenameMap: { [key: string]: string } = {
      "grid-scan": "GridScan.tsx",
      "shuffle-text": "Shuffle.tsx",
      "split-text": "SplitText.tsx",
      "animated-mesh": "AnimatedMeshBackground.tsx",
      "infinite-menu": "InfiniteMenu.tsx",
      "target-cursor": "TargetCursor.tsx",
    };
    
    const filePath = path.join(process.cwd(), "components/dive-ui", filenameMap[slug]);
    sourceCode = fs.readFileSync(filePath, "utf-8");
  } catch (e) {
    sourceCode = "// Source code not found";
  }

  return (
    <div className="space-y-10">
      <div className="space-y-4">
        <h1 className="text-4xl font-black tracking-tight">{name}</h1>
        <p className="text-lg text-zinc-500 dark:text-zinc-400 max-w-[700px]">
          {description}
        </p>
      </div>

      <ComponentPreview name={name} code={sourceCode}>
        <div className="w-full h-full min-h-[400px] border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden relative bg-black/5 dark:bg-white/5">
           <Component {...props} />
        </div>
      </ComponentPreview>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight">Installation</h2>
        <div className="p-6 rounded-2xl bg-zinc-950 text-zinc-300 font-mono text-sm">
           <p className="mb-2 text-zinc-500"># Install dependencies</p>
           <p>pnpm add three @types/three @react-three/fiber @react-three/drei gsap @gsap/react postprocessing</p>
           <br />
           <p className="mb-2 text-zinc-500"># Copy the component to your project</p>
           <p>components/dive-ui/{name.replace(/\s+/g, '')}.tsx</p>
        </div>
      </div>
    </div>
  );
}
