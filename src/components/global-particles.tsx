'use client';

import { useEffect, useState } from 'react';

interface ParticleItem {
  left: number;
  top: number;
  width: number;
  height: number;
  duration: number;
  delay: number;
}

export default function GlobalParticles() {
  const [particles, setParticles] = useState<ParticleItem[]>([]);

  useEffect(() => {
    // Generate particles only on the client
    const generatedParticles: ParticleItem[] = Array.from({ length: 60 }, () => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      width: Math.random() * 3 + 1,
      height: Math.random() * 3 + 1,
      duration: Math.random() * 15 + 15,
      delay: -(Math.random() * 30),
    }));
    setParticles(generatedParticles);
  }, []);

  if (particles.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[-40] pointer-events-none hidden dark:block overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes globalParticleFloat {
          0%   { transform: translate3d(0, 0, 0); opacity: 0; }
          20%  { opacity: 0.35; }
          80%  { opacity: 0.35; }
          100% { transform: translate3d(0, -120px, 0); opacity: 0; }
        }
      ` }} />
      {particles.map((p, i) => (
        <div
          key={`gp-${i}`}
          className="absolute rounded-full"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: `${p.width}px`,
            height: `${p.height}px`,
            background: 'rgba(147,197,253,0.7)',
            animation: `globalParticleFloat ${p.duration}s ease-in-out infinite`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
