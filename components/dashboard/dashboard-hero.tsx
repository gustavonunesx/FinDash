"use client";

import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import type { Score502030Result } from "@/lib/score";
import { scoreColor, scoreGradient } from "@/lib/score";
import { animateCounter, getGreeting } from "@/lib/utils";
import { cn } from "@/lib/utils";

gsap.registerPlugin(useGSAP);

interface DashboardHeroProps {
  nome: string;
  scoreData: Score502030Result;
}

export function DashboardHero({ nome, scoreData }: DashboardHeroProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const greetingRef = useRef<HTMLParagraphElement>(null);
  const nameRef = useRef<HTMLHeadingElement>(null);
  const scoreRef = useRef<HTMLDivElement>(null);
  const messageRef = useRef<HTMLParagraphElement>(null);
  const [displayScore, setDisplayScore] = useState(0);

  useGSAP(
    () => {
      if (!sectionRef.current) return;

      const els = [greetingRef.current, nameRef.current, scoreRef.current, messageRef.current].filter(
        Boolean
      );

      gsap.set(els, { opacity: 0, y: 24 });

      gsap.fromTo(
        els,
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          stagger: 0.12,
          ease: "power3.out",
        }
      );

      if (nameRef.current) {
        const chars = nome.split("");
        nameRef.current.innerHTML = chars
          .map((c) => `<span class="inline-block">${c === " " ? "&nbsp;" : c}</span>`)
          .join("");

        gsap.fromTo(
          nameRef.current.querySelectorAll("span"),
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.4, stagger: 0.03, delay: 0.3, ease: "back.out(1.4)" }
        );
      }
    },
    { scope: sectionRef, dependencies: [nome] }
  );

  useEffect(() => {
    return animateCounter(0, scoreData.score, 1500, setDisplayScore);
  }, [scoreData.score]);

  return (
    <section
      ref={sectionRef}
      className={cn(
        "dashboard-section relative overflow-hidden px-6 md:px-12",
        "bg-gradient-to-b",
        scoreGradient(scoreData.status)
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(29,158,117,0.06),transparent_60%)]" />

      <div className="relative mx-auto max-w-5xl">
        <p ref={greetingRef} className="text-lg text-muted-foreground md:text-xl">
          {getGreeting()},
        </p>
        <h1
          ref={nameRef}
          className="mt-2 text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl"
        >
          {nome}
        </h1>

        <div ref={scoreRef} className="mt-12 md:mt-16">
          <p className="text-sm uppercase tracking-widest text-muted-foreground">
            Score financeiro
          </p>
          <div
            className={cn(
              "font-mono text-7xl font-bold tracking-tighter md:text-8xl lg:text-[120px]",
              scoreColor(scoreData.status)
            )}
          >
            {displayScore}
          </div>
        </div>

        <p ref={messageRef} className="mt-6 max-w-xl text-lg text-muted-foreground md:text-xl">
          {scoreData.mensagem}
        </p>
      </div>
    </section>
  );
}
