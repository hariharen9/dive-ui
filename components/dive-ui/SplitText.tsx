"use client";

import { useRef, useEffect, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText as GSAPSplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, GSAPSplitText);
}

const SplitText = ({
  text,
  className = "",
  staggerDelay = 100,
  initialDelay = 0,
  duration = 0.6,
  ease = "power3.out",
  splitType = "chars",
  from = { opacity: 0, y: 40 },
  to = { opacity: 1, y: 0 },
  threshold = 0.1,
  rootMargin = "-100px",
  textAlign = "center",
  tag = "p",
  onLetterAnimationComplete,
  style = {},
  fontSize,
  color,
  lineClamp,
  ...props
}: any) => {
  const ref = useRef(null);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    if (document.fonts.status === "loaded") {
      setFontsLoaded(true);
    } else {
      document.fonts.ready.then(() => {
        setFontsLoaded(true);
      });
    }
  }, []);

  useGSAP(
    () => {
      if (!ref.current || !text || !fontsLoaded) return;
      const el = ref.current as any;

      if (el._rbsplitInstance) {
        try { el._rbsplitInstance.revert(); } catch (_) { /* ignore */ }
        el._rbsplitInstance = null;
      }

      const startPct = (1 - threshold) * 100;
      const marginMatch = /^(-?\d+(?:\.\d+)?)(px|em|rem|%)?$/.exec(rootMargin);
      const marginValue = marginMatch ? parseFloat(marginMatch[1]) : 0;
      const marginUnit = marginMatch ? marginMatch[2] || "px" : "px";
      const sign = marginValue === 0 ? "" : (marginValue < 0 ? `-=${Math.abs(marginValue)}${marginUnit}` : `+=${marginValue}${marginUnit}`);
      const start = `top ${startPct}%${sign}`;

      const splitInstance = new GSAPSplitText(el, {
        type: splitType,
        smartWrap: true,
        autoSplit: splitType === "lines",
        linesClass: "split-line",
        wordsClass: "split-word",
        charsClass: "split-char",
        reduceWhiteSpace: false,
        onSplit: (self: any) => {
          let targets;
          if (splitType.includes("chars") && self.chars.length) targets = self.chars;
          else if (splitType.includes("words") && self.words.length) targets = self.words;
          else if (splitType.includes("lines") && self.lines.length) targets = self.lines;
          else targets = self.chars || self.words || self.lines;

          return gsap.fromTo(
            targets,
            { ...from },
            {
              ...to,
              delay: initialDelay / 1000,
              duration,
              ease,
              stagger: staggerDelay / 1000,
              scrollTrigger: {
                trigger: el,
                start,
                once: true,
                fastScrollEnd: true,
                anticipatePin: 0.4,
              },
              onComplete: () => {
                onLetterAnimationComplete?.();
              },
              willChange: "transform, opacity",
              force3D: true,
            }
          );
        },
      });
      el._rbsplitInstance = splitInstance;

      return () => {
        ScrollTrigger.getAll().forEach((st) => { if (st.trigger === el) st.kill(); });
        try { splitInstance.revert(); } catch (_) { /* ignore */ }
        el._rbsplitInstance = null;
      };
    },
    {
      dependencies: [
        text,
        staggerDelay,
        initialDelay,
        duration,
        ease,
        splitType,
        JSON.stringify(from),
        JSON.stringify(to),
        threshold,
        rootMargin,
        fontsLoaded,
        onLetterAnimationComplete,
      ],
      scope: ref,
    }
  );

  const finalStyle = {
    textAlign,
    wordWrap: "break-word",
    willChange: "transform, opacity",
    ...(fontSize ? { fontSize } : {}),
    ...(color ? { color } : {}),
    ...(lineClamp ? {
        display: '-webkit-box',
        WebkitLineClamp: lineClamp,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden'
    } : {}),
    ...style,
  };

  const Tag = tag as any;

  return (
    <Tag
      ref={ref}
      style={finalStyle}
      className={`split-parent overflow-hidden inline-block whitespace-normal ${className}`}
      {...props}
    >
      {text}
    </Tag>
  );
};

export default SplitText;
