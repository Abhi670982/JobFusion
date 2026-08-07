'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

interface StarItem {
  id: number;
  top: string;
  left: string;
  width: string;
  height: string;
  animationDelay: string;
  animationDuration: string;
  layer: number;
}

export default function HeroBackground() {
  const [mounted, setMounted] = useState(false);
  const [starItems, setStarItems] = useState<StarItem[]>([]);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    // Generate starfield
    const generatedStars: StarItem[] = [];
    let starId = 0;
    
    for (let i = 0; i < 30; i++) {
      generatedStars.push({
        id: starId++,
        layer: 1,
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        width: '2px',
        height: '2px',
        animationDelay: `${Math.random() * 5}s`,
        animationDuration: `${2 + Math.random() * 3}s`,
      });
    }

    for (let i = 0; i < 40; i++) {
      generatedStars.push({
        id: starId++,
        layer: 2,
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        width: '1.5px',
        height: '1.5px',
        animationDelay: `${Math.random() * 5}s`,
        animationDuration: `${3 + Math.random() * 4}s`,
      });
    }

    for (let i = 0; i < 60; i++) {
      generatedStars.push({
        id: starId++,
        layer: 3,
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        width: '1px',
        height: '1px',
        animationDelay: `${Math.random() * 5}s`,
        animationDuration: `${2.5 + Math.random() * 3.5}s`,
      });
    }

    setStarItems(generatedStars);
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <>
      {/* ── Hero-specific background pattern (absolute, scoped to hero section) ── */}
      {resolvedTheme === 'dark' && (
        <>
          {/* Deep Black & Dark Navy Base with Blue Ambient Glow */}
          <div className="absolute inset-0 pointer-events-none z-[-1] overflow-hidden">
            {/* Deep Black Base */}
            <div className="absolute inset-0 bg-[#020617]" />

            {/* Extremely subtle center glow */}
            <div className="absolute inset-0 opacity-40 mix-blend-screen blur-3xl" style={{
              background: 'radial-gradient(circle at 50% 40%, rgba(29, 78, 216, 0.15) 0%, transparent 60%)'
            }} />
          </div>

          {/* Animated Starfield */}
          <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden"
            style={{
              maskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)'
            }}
          >
            <style dangerouslySetInnerHTML={{
              __html: `
              .star {
                position: absolute;
                border-radius: 50%;
                background-color: white;
                animation: twinkle linear infinite;
              }
              
              @keyframes twinkle {
                0% { opacity: 0.1; transform: scale(0.8); }
                50% { opacity: 0.9; transform: scale(1.2); }
                100% { opacity: 0.1; transform: scale(0.8); }
              }
              
              @keyframes drift {
                0% { transform: translateY(0) translateX(0); }
                100% { transform: translateY(-30px) translateX(15px); }
              }

              .star-layer {
                position: absolute;
                inset: -50px;
                animation: drift linear infinite alternate;
              }
              
              .star-layer-1 { animation-duration: 40s; }
              .star-layer-2 { animation-duration: 70s; }
              .star-layer-3 { animation-duration: 100s; }
            `}} />

            <div className="star-layer star-layer-1">
              {starItems.filter(s => s.layer === 1).map(s => (
                <div key={s.id} className="star" style={{
                  top: s.top, left: s.left, width: s.width, height: s.height,
                  animationDelay: s.animationDelay, animationDuration: s.animationDuration
                }} />
              ))}
            </div>
            <div className="star-layer star-layer-2">
              {starItems.filter(s => s.layer === 2).map(s => (
                <div key={s.id} className="star" style={{
                  top: s.top, left: s.left, width: s.width, height: s.height,
                  animationDelay: s.animationDelay, animationDuration: s.animationDuration
                }} />
              ))}
            </div>
            <div className="star-layer star-layer-3">
              {starItems.filter(s => s.layer === 3).map(s => (
                <div key={s.id} className="star" style={{
                  top: s.top, left: s.left, width: s.width, height: s.height,
                  animationDelay: s.animationDelay, animationDuration: s.animationDuration
                }} />
              ))}
            </div>
          </div>
        </>
      )}

      {/* Bottom Fade to Page Background */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background to-transparent pointer-events-none z-20" />
    </>
  );
}
