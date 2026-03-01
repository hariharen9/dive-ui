import Link from "next/link";
import Shuffle from "@/components/dive-ui/Shuffle";
import { ArrowRight, Sparkles, Zap, ShieldCheck } from "lucide-react";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden flex flex-col items-center justify-center px-6">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full -z-10 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.05),transparent_50%)]" />
      
      <div className="max-w-4xl w-full text-center space-y-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-widest animate-fade-in">
          <Sparkles size={14} />
          New Generation UI Library
        </div>

        <div className="space-y-4">
          <Shuffle 
            text="DIVE UI" 
            className="text-6xl md:text-8xl font-black tracking-tighter"
            shuffleTimes={10}
            duration={0.8}
          />
          <p className="text-xl md:text-2xl text-zinc-500 dark:text-zinc-400 font-medium max-w-2xl mx-auto leading-relaxed">
            Elevate your React projects with <span className="text-zinc-900 dark:text-zinc-100 italic">high-performance</span> animations and immersive 3D experiences.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
          <Link 
            href="/docs"
            className="group relative flex items-center gap-2 px-8 py-4 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black rounded-2xl font-bold transition-all hover:scale-105 active:scale-95 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="relative z-10">Explore Components</span>
            <ArrowRight size={18} className="relative z-10 group-hover:translate-x-1 transition-transform" />
          </Link>
          <a 
            href="https://github.com/hariharen9"
            target="_blank"
            className="px-8 py-4 border border-zinc-200 dark:border-zinc-800 rounded-2xl font-bold hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all active:scale-95"
          >
            Star on GitHub
          </a>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-20 border-t border-zinc-100 dark:border-zinc-900 animate-fade-in" style={{ animationDelay: "0.4s" }}>
           <FeatureCard 
              icon={<Zap className="text-yellow-500" />}
              title="High Performance"
              description="Built with WebGL and GPU acceleration for 60fps animations."
           />
           <FeatureCard 
              icon={<ShieldCheck className="text-green-500" />}
              title="Fully Typed"
              description="Complete TypeScript support for a seamless developer experience."
           />
           <FeatureCard 
              icon={<Sparkles className="text-blue-500" />}
              title="Modern Tech"
              description="Utilizes Three.js, GSAP, and Framer Motion for premium effects."
           />
        </div>
      </div>
    </main>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-6 text-left space-y-3 rounded-2xl border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 transition-all group">
       <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center group-hover:scale-110 transition-transform">
          {icon}
       </div>
       <h3 className="font-bold text-zinc-900 dark:text-zinc-100">{title}</h3>
       <p className="text-sm text-zinc-500 leading-relaxed">{description}</p>
    </div>
  )
}