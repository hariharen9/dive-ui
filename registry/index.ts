import { GridScan } from "@/components/dive-ui/GridScan";
import Shuffle from "@/components/dive-ui/Shuffle";
import InfiniteMenu from "@/components/dive-ui/InfiniteMenu";
import TargetCursor from "@/components/dive-ui/TargetCursor";
import SplitText from "@/components/dive-ui/SplitText";
import AnimatedMeshBackground from "@/components/dive-ui/AnimatedMeshBackground";

export type ComponentRegistry = {
  [key: string]: {
    name: string;
    description: string;
    component: React.ComponentType<any>;
    category: "Specialized" | "Text" | "Background" | "Interaction";
    slug: string;
    props?: any;
  };
};

export const registry: ComponentRegistry = {
  "grid-scan": {
    name: "Grid Scan",
    description: "A sophisticated Cyberpunk-style scanning effect with webcam face tracking support.",
    component: GridScan,
    category: "Specialized",
    slug: "grid-scan",
    props: {
      quality: "high",
      scanColor: "#FF9FFC",
      gridScale: 0.1,
    },
  },
  "shuffle-text": {
    name: "Shuffle Text",
    description: "Deciphering text animation using GSAP SplitText.",
    component: Shuffle,
    category: "Text",
    slug: "shuffle-text",
    props: {
      text: "DIVE INTO THE CODE",
      duration: 0.5,
      shuffleTimes: 5,
    },
  },
  "split-text": {
    name: "Split Text",
    description: "Animated text reveal with stagger effects using GSAP.",
    component: SplitText,
    category: "Text",
    slug: "split-text",
    props: {
      text: "Experience the depth of animation with Dive UI.",
      staggerDelay: 50,
      duration: 0.8,
    },
  },
  "animated-mesh": {
    name: "Animated Mesh",
    description: "An organic, interactive 3D terrain/mesh background built with Three.js shaders.",
    component: AnimatedMeshBackground,
    category: "Background",
    slug: "animated-mesh",
    props: {
      cursorForce: 7.0,
    },
  },
  "infinite-menu": {
    name: "Infinite 3D Menu",
    description: "A raw WebGL powered 3D cylindrical menu with smooth arcball controls.",
    component: InfiniteMenu,
    category: "Specialized",
    slug: "infinite-menu",
    props: {
      items: [
        { title: "Project Alpha", description: "The beginning", image: "https://picsum.photos/500/500?random=1", link: "#" },
        { title: "Project Beta", description: "Moving forward", image: "https://picsum.photos/500/500?random=2", link: "#" },
        { title: "Project Gamma", description: "The evolution", image: "https://picsum.photos/500/500?random=3", link: "#" },
      ],
    },
  },
  "target-cursor": {
    name: "Target Cursor",
    description: "A magnetic, lagging cursor with corner brackets that snap to interactive elements.",
    component: TargetCursor,
    category: "Interaction",
    slug: "target-cursor",
    props: {},
  },
};
