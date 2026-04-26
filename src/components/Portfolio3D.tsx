/**
 * 3D Portfolio Visualization — The Solar System
 * ───────────────────────────────────────────────
 * Each startup is a planet orbiting the center.
 * Size = MRR, Color = Category, Orbit Distance = Risk, Glow = Trust Score.
 *
 * Built with React Three Fiber + drei for production-grade 3D.
 * This is the "2050 tech" visual that makes jaws drop.
 */

import { useRef, useMemo, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Html, Float } from '@react-three/drei';
import * as THREE from 'three';
import type { DbStartup } from '@/types/database';

// ── Category Colors ──────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  DeFi: '#10B981',
  Fintech: '#3B82F6',
  SaaS: '#8B5CF6',
  Infrastructure: '#F59E0B',
  Identity: '#EC4899',
  Data: '#06B6D4',
  'Supply Chain': '#14B8A6',
  NFT: '#F97316',
  Gaming: '#EF4444',
  Social: '#A855F7',
};

function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? '#6B7280';
}

// ── Startup Planet Component ─────────────────────────────────────────

interface PlanetProps {
  startup: DbStartup;
  orbitRadius: number;
  orbitSpeed: number;
  initialAngle: number;
  onSelect: (startup: DbStartup) => void;
  selected: boolean;
}

function StartupPlanet({ startup, orbitRadius, orbitSpeed, initialAngle, onSelect, selected }: PlanetProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Planet size based on MRR (normalized)
  const size = Math.max(0.15, Math.min(0.8, startup.mrr / 200000));
  const color = getCategoryColor(startup.category);

  // Trust score affects glow intensity
  const glowIntensity = startup.trust_score / 100;

  // Orbit animation
  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.getElapsedTime();
      const angle = initialAngle + time * orbitSpeed;
      meshRef.current.position.x = Math.cos(angle) * orbitRadius;
      meshRef.current.position.z = Math.sin(angle) * orbitRadius;
      meshRef.current.position.y = Math.sin(angle * 0.5) * 0.3; // Slight vertical wobble

      // Rotate planet on its axis
      meshRef.current.rotation.y += 0.01;
    }

    if (glowRef.current && meshRef.current) {
      glowRef.current.position.copy(meshRef.current.position);
    }
  });

  return (
    <group>
      {/* Orbit ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[orbitRadius - 0.01, orbitRadius + 0.01, 64]} />
        <meshBasicMaterial color={color} transparent opacity={0.1} side={THREE.DoubleSide} />
      </mesh>

      {/* Glow sphere */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[size * 1.8, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={glowIntensity * 0.15} />
      </mesh>

      {/* Planet */}
      <mesh
        ref={meshRef}
        onPointerOver={() => { setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default'; }}
        onClick={() => onSelect(startup)}
        scale={hovered || selected ? 1.3 : 1}
      >
        <sphereGeometry args={[size, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered || selected ? 0.5 : 0.2}
          roughness={0.3}
          metalness={0.7}
        />

        {/* Label */}
        {(hovered || selected) && (
          <Html distanceFactor={8} center style={{ pointerEvents: 'none' }}>
            <div className="bg-card/95 backdrop-blur-sm border border-border rounded-lg px-3 py-2 shadow-lg whitespace-nowrap">
              <p className="text-xs font-bold text-foreground">{startup.name}</p>
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                <span>${(startup.mrr / 1000).toFixed(0)}K MRR</span>
                <span className="text-emerald-500">+{Number(startup.growth_rate)}%</span>
                <span>Trust: {startup.trust_score}</span>
              </div>
            </div>
          </Html>
        )}
      </mesh>

      {/* Verification ring (for verified startups) */}
      {startup.verified && meshRef.current && (
        <mesh position={meshRef.current?.position} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[size * 1.2, size * 1.4, 32]} />
          <meshBasicMaterial color="#10B981" transparent opacity={0.5} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}

// ── Central Sun ──────────────────────────────────────────────────────

function CentralSun() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.002;
      const scale = 1 + Math.sin(state.clock.getElapsedTime() * 0.5) * 0.05;
      meshRef.current.scale.setScalar(scale);
    }
  });

  return (
    <group>
      {/* Core */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial
          color="#534AB7"
          emissive="#534AB7"
          emissiveIntensity={1}
          roughness={0}
          metalness={1}
        />
      </mesh>

      {/* Glow layers */}
      <mesh>
        <sphereGeometry args={[0.7, 16, 16]} />
        <meshBasicMaterial color="#534AB7" transparent opacity={0.15} />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.0, 16, 16]} />
        <meshBasicMaterial color="#534AB7" transparent opacity={0.05} />
      </mesh>

      {/* Label */}
      <Html center distanceFactor={6} position={[0, -0.9, 0]} style={{ pointerEvents: 'none' }}>
        <div className="text-center whitespace-nowrap">
          <p className="text-xs font-bold text-primary">ChainTrust</p>
          <p className="text-[9px] text-muted-foreground">Ecosystem</p>
        </div>
      </Html>
    </group>
  );
}

// ── Particle Field ───────────────────────────────────────────────────

function ParticleField() {
  const count = 200;
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 30;
    }
    return pos;
  }, []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.03} color="#534AB7" transparent opacity={0.4} sizeAttenuation />
    </points>
  );
}

// ── Scene Content ────────────────────────────────────────────────────

interface SceneProps {
  startups: DbStartup[];
  selectedStartup: DbStartup | null;
  onSelectStartup: (startup: DbStartup) => void;
}

function Scene({ startups, selectedStartup, onSelectStartup }: SceneProps) {
  // Sort startups by MRR for orbit assignment
  const sorted = useMemo(
    () => [...startups].sort((a, b) => b.mrr - a.mrr),
    [startups],
  );

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <pointLight position={[0, 0, 0]} intensity={2} color="#534AB7" distance={20} />
      <pointLight position={[10, 5, 5]} intensity={0.5} color="#ffffff" />
      <pointLight position={[-10, -5, -5]} intensity={0.3} color="#10B981" />

      {/* Background particles */}
      <ParticleField />

      {/* Central sun */}
      <CentralSun />

      {/* Startup planets */}
      {sorted.map((startup, i) => {
        const orbitRadius = 2 + i * 0.8; // Spread orbits
        const orbitSpeed = 0.3 / (i + 1); // Outer planets move slower
        const initialAngle = (i * Math.PI * 2) / sorted.length; // Spread evenly

        return (
          <StartupPlanet
            key={startup.id}
            startup={startup}
            orbitRadius={orbitRadius}
            orbitSpeed={orbitSpeed}
            initialAngle={initialAngle}
            onSelect={onSelectStartup}
            selected={selectedStartup?.id === startup.id}
          />
        );
      })}

      {/* Camera controls */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        autoRotate={!selectedStartup}
        autoRotateSpeed={0.3}
        maxDistance={25}
        minDistance={3}
      />
    </>
  );
}

// ── Main Component ───────────────────────────────────────────────────

interface Portfolio3DProps {
  startups: DbStartup[];
}

export default function Portfolio3D({ startups }: Portfolio3DProps) {
  const [selectedStartup, setSelectedStartup] = useState<DbStartup | null>(null);

  if (startups.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-8 text-center">
        <p className="text-muted-foreground">No startups to visualize.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/10 to-cyan-500/10 p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-foreground">3D Portfolio Universe</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {startups.length} startups &bull; Size = MRR &bull; Color = Category &bull; Glow = Trust Score
            </p>
          </div>
          {/* Legend */}
          <div className="flex flex-wrap gap-2">
            {Object.entries(CATEGORY_COLORS).slice(0, 5).map(([cat, color]) => (
              <span key={cat} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                {cat}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 3D Canvas */}
      <div className="relative" style={{ height: '500px' }}>
        <Canvas
          camera={{ position: [0, 5, 10], fov: 60 }}
          style={{ background: 'linear-gradient(180deg, #0a0a1a 0%, #1a1a2e 100%)' }}
        >
          <Suspense fallback={null}>
            <Scene
              startups={startups}
              selectedStartup={selectedStartup}
              onSelectStartup={setSelectedStartup}
            />
          </Suspense>
        </Canvas>

        {/* Selected startup info panel */}
        {selectedStartup && (
          <div className="absolute bottom-4 left-4 right-4 sm:left-4 sm:right-auto sm:w-80 bg-card/95 backdrop-blur-sm border border-border rounded-lg p-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-foreground">{selectedStartup.name}</h4>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] px-1.5 py-0.5 rounded" style={{
                    backgroundColor: getCategoryColor(selectedStartup.category) + '20',
                    color: getCategoryColor(selectedStartup.category),
                  }}>
                    {selectedStartup.category}
                  </span>
                  {selectedStartup.verified && (
                    <span className="text-[10px] text-emerald-500">Verified</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedStartup(null)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Close
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3">
              <div className="text-center">
                <p className="text-sm font-bold font-mono text-foreground">${(selectedStartup.mrr / 1000).toFixed(0)}K</p>
                <p className="text-[10px] text-muted-foreground">MRR</p>
              </div>
              <div className="text-center">
                <p className={`text-sm font-bold font-mono ${Number(selectedStartup.growth_rate) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {Number(selectedStartup.growth_rate) >= 0 ? '+' : ''}{Number(selectedStartup.growth_rate)}%
                </p>
                <p className="text-[10px] text-muted-foreground">Growth</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-bold font-mono text-foreground">{selectedStartup.trust_score}</p>
                <p className="text-[10px] text-muted-foreground">Trust</p>
              </div>
            </div>
            <a
              href={`/startup/${selectedStartup.id}`}
              className="mt-3 w-full inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition"
            >
              View Full Detail
            </a>
          </div>
        )}

        {/* Controls hint */}
        <div className="absolute top-3 right-3 text-[10px] text-white/40 bg-black/30 backdrop-blur-sm rounded px-2 py-1">
          Drag to rotate &bull; Scroll to zoom &bull; Click a planet
        </div>
      </div>
    </div>
  );
}
