"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import React, { useRef, useMemo } from "react";
import * as THREE from "three";
import { cn } from "@/lib/utils";

interface DotGlobeHeroProps {
  rotationSpeed?: number;
  className?: string;
  children?: React.ReactNode;
}

// Builds a $ sign out of Three.js primitives:
// - two C-arcs (torus segments) stacked
// - a vertical bar (cylinder) passing through both
// All share the same green color + wireframe look.
const DollarSign: React.FC<{ rotationSpeed: number }> = ({ rotationSpeed }) => {
  const groupRef = useRef<THREE.Group>(null!);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y += rotationSpeed;
    // gentle float
    groupRef.current.position.y = Math.sin(clock.getElapsedTime() * 0.6) * 0.06;
  });

  const mat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#1d9e75",
        transparent: true,
        opacity: 0.55,
        roughness: 0.3,
        metalness: 0.7,
        wireframe: false,
      }),
    []
  );

  // Arc helper: a torus sliced to a C shape
  // thetaStart / thetaLength in radians
  const arcArgs = (
    radius: number,
    tube: number,
    thetaStart: number,
    thetaLength: number
  ): [number, number, number, number, number, number] => [
    radius,
    tube,
    16,
    48,
    thetaStart,
    thetaLength,
  ];

  return (
    <group ref={groupRef}>
      {/* vertical bar */}
      <mesh material={mat} position={[0, 0, 0]}>
        <cylinderGeometry args={[0.065, 0.065, 2.4, 24]} />
      </mesh>

      {/* top C-arc (opens left) */}
      <mesh
        material={mat}
        position={[0, 0.52, 0]}
        rotation={[0, 0, Math.PI]}
      >
        <torusGeometry args={arcArgs(0.46, 0.1, Math.PI * 0.18, Math.PI * 1.3)} />
      </mesh>

      {/* bottom C-arc (opens right) */}
      <mesh
        material={mat}
        position={[0, -0.52, 0]}
        rotation={[0, 0, 0]}
      >
        <torusGeometry args={arcArgs(0.46, 0.1, Math.PI * 0.18, Math.PI * 1.3)} />
      </mesh>

      {/* glow point light behind the sign */}
      <pointLight position={[0, 0, 1.2]} intensity={2.5} color="#1d9e75" distance={4} />
    </group>
  );
};

const DotGlobeHero = React.forwardRef<HTMLDivElement, DotGlobeHeroProps>(
  ({ rotationSpeed = 0.005, className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("relative w-full overflow-hidden", className)}
        {...props}
      >
        <div className="relative z-10 flex flex-col items-center justify-center h-full">
          {children}
        </div>

        <div className="absolute inset-0 z-0 pointer-events-none">
          <Canvas>
            <PerspectiveCamera makeDefault position={[0, 0, 4]} fov={60} />
            <ambientLight intensity={0.3} />
            <pointLight position={[-4, 4, 4]} intensity={1.8} color="#ffffff" />
            <pointLight position={[4, -2, 2]} intensity={0.8} color="#378add" />
            <DollarSign rotationSpeed={rotationSpeed} />
          </Canvas>
        </div>
      </div>
    );
  }
);

DotGlobeHero.displayName = "DotGlobeHero";

export { DotGlobeHero, type DotGlobeHeroProps };
