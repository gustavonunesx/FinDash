"use client"

import { useEffect, useRef } from "react"
import gsap from "gsap"

const floatingIcons = [
  { type: "coin", char: "$", size: 24 },
  { type: "coin", char: "R$", size: 20 },
  { type: "chart", char: "📈", size: 28 },
  { type: "coin", char: "¢", size: 18 },
  { type: "piggy", char: "🐷", size: 26 },
  { type: "coin", char: "$", size: 22 },
  { type: "chart", char: "📊", size: 24 },
  { type: "coin", char: "€", size: 20 },
  { type: "wallet", char: "💳", size: 22 },
  { type: "coin", char: "$", size: 26 },
  { type: "target", char: "🎯", size: 24 },
  { type: "coin", char: "¥", size: 20 },
]

export function AnimatedBackground() {
  const containerRef = useRef<HTMLDivElement>(null)
  const elementsRef = useRef<HTMLDivElement[]>([])

  useEffect(() => {
    if (!containerRef.current) return

    const elements = elementsRef.current
    const ctx = gsap.context(() => {
      // Initial positioning with random positions
      elements.forEach((el, i) => {
        if (!el) return
        
        const startX = Math.random() * 100
        const startY = Math.random() * 100
        
        gsap.set(el, {
          left: `${startX}%`,
          top: `${startY}%`,
          opacity: 0.15 + Math.random() * 0.15,
          scale: 0.8 + Math.random() * 0.4,
          rotation: Math.random() * 360,
        })

        // Floating animation
        gsap.to(el, {
          y: `${-30 - Math.random() * 50}`,
          x: `${(Math.random() - 0.5) * 60}`,
          rotation: `+=${Math.random() > 0.5 ? 360 : -360}`,
          duration: 8 + Math.random() * 8,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: i * 0.3,
        })

        // Subtle pulse
        gsap.to(el, {
          opacity: 0.08 + Math.random() * 0.12,
          scale: 0.9 + Math.random() * 0.3,
          duration: 3 + Math.random() * 2,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: i * 0.2,
        })
      })
    }, containerRef)

    return () => ctx.revert()
  }, [])

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
      aria-hidden="true"
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(29,158,117,0.15),transparent)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_80%_80%,rgba(29,158,117,0.08),transparent)]" />
      
      {/* Grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Floating financial elements */}
      {floatingIcons.map((icon, i) => (
        <div
          key={i}
          ref={(el) => { if (el) elementsRef.current[i] = el }}
          className="absolute text-primary/30 font-mono font-bold select-none"
          style={{ fontSize: icon.size }}
        >
          {icon.char}
        </div>
      ))}

      {/* Animated gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-pulse delay-1000" />
    </div>
  )
}
