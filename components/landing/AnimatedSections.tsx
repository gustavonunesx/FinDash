"use client"

import { useEffect, useRef, ReactNode, useState } from "react"
import gsap from "gsap"

interface AnimatedHeroProps {
  children: ReactNode
}

export function AnimatedHero({ children }: AnimatedHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (!containerRef.current) return

    const initAnimations = async () => {
      const { ScrollTrigger } = await import("gsap/ScrollTrigger")
      gsap.registerPlugin(ScrollTrigger)

      // Set elements visible before animating
      setIsReady(true)

      const ctx = gsap.context(() => {
        // Badge animation
        gsap.fromTo("[data-animate='badge']", 
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }
        )

        // Title animation
        gsap.fromTo("[data-animate='title']", 
          { y: 60, opacity: 0 },
          { y: 0, opacity: 1, duration: 1, ease: "power3.out", delay: 0.2 }
        )

        // Subtitle animation
        gsap.fromTo("[data-animate='subtitle']", 
          { y: 40, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.9, ease: "power3.out", delay: 0.4 }
        )

        // CTA buttons with stagger
        gsap.fromTo("[data-animate='cta']", 
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.7, stagger: 0.15, ease: "power3.out", delay: 0.6 }
        )

        // Footer text
        gsap.fromTo("[data-animate='footer-text']", 
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, ease: "power3.out", delay: 0.9 }
        )
      }, containerRef)

      return () => ctx.revert()
    }

    initAnimations()
  }, [])

  return (
    <div ref={containerRef} style={{ visibility: isReady ? 'visible' : 'hidden' }}>
      {children}
    </div>
  )
}

interface AnimatedFeaturesProps {
  children: ReactNode
}

export function AnimatedFeatures({ children }: AnimatedFeaturesProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const initAnimations = async () => {
      const { ScrollTrigger } = await import("gsap/ScrollTrigger")
      gsap.registerPlugin(ScrollTrigger)

      const ctx = gsap.context(() => {
        gsap.fromTo("[data-animate='feature-card']", 
          { y: 80, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            stagger: 0.15,
            ease: "power3.out",
            scrollTrigger: {
              trigger: containerRef.current,
              start: "top 85%",
              toggleActions: "play none none none",
            },
          }
        )
      }, containerRef)

      return () => ctx.revert()
    }

    initAnimations()
  }, [])

  return (
    <div ref={containerRef}>
      {children}
    </div>
  )
}

interface AnimatedPricingProps {
  children: ReactNode
}

export function AnimatedPricing({ children }: AnimatedPricingProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const initAnimations = async () => {
      const { ScrollTrigger } = await import("gsap/ScrollTrigger")
      gsap.registerPlugin(ScrollTrigger)

      const ctx = gsap.context(() => {
        // Section title
        gsap.fromTo("[data-animate='pricing-title']", 
          { y: 50, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: {
              trigger: containerRef.current,
              start: "top 85%",
              toggleActions: "play none none none",
            },
          }
        )

        // Pricing cards with stagger
        gsap.fromTo("[data-animate='pricing-card']", 
          { y: 80, opacity: 0, scale: 0.95 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.8,
            stagger: 0.2,
            ease: "power3.out",
            scrollTrigger: {
              trigger: "[data-animate='pricing-card']",
              start: "top 90%",
              toggleActions: "play none none none",
            },
          }
        )
      }, containerRef)

      return () => ctx.revert()
    }

    initAnimations()
  }, [])

  return (
    <div ref={containerRef}>
      {children}
    </div>
  )
}
