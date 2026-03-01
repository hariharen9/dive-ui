import { Sidebar } from "@/components/showcase/Sidebar";

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 pl-64 pt-16">
        <div className="max-w-5xl mx-auto px-10 py-12">
          {children}
        </div>
      </main>
    </div>
  );
}
