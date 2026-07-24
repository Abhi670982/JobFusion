'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

const companies = [
  { name: 'Accenture', domain: 'accenture.com', color: '#A100FF' },
  { name: 'IBM', domain: 'ibm.com', color: '#054ADA' },
  { name: 'Cisco', domain: 'cisco.com', color: '#00BCEB' },
  { name: 'Deloitte', domain: 'deloitte.com', color: '#86BC25' },
  { name: 'Google', domain: 'google.com', color: '#4285F4' },
  { name: 'Microsoft', domain: 'microsoft.com', color: '#00A4EF' },
  { name: 'Amazon', domain: 'amazon.com', color: '#FF9900' },
  { name: 'NVIDIA', domain: 'nvidia.com', color: '#76B900' },
  { name: 'Apple', domain: 'apple.com', color: '#A2AAAD' },
  { name: 'Meta', domain: 'meta.com', color: '#0082FB' },
  { name: 'Adobe', domain: 'adobe.com', color: '#FF0000' },
  { name: 'Oracle', domain: 'oracle.com', color: '#C74634' },
  { name: 'TCS', domain: 'tcs.com', color: '#E31837' },
  { name: 'Infosys', domain: 'infosys.com', color: '#007CC3' },
  { name: 'HCLTech', domain: 'hcltech.com', color: '#0064C8' },
  { name: 'Wipro', domain: 'wipro.com', color: '#00A2E8' },
  { name: 'Tech Mahindra', domain: 'techmahindra.com', color: '#E4223A' },
  { name: 'LTIMindtree', domain: 'ltimindtree.com', color: '#0A73B6' },
  { name: 'Cognizant', domain: 'cognizant.com', color: '#000048' },
  { name: 'Capgemini', domain: 'capgemini.com', color: '#0070AD' },
];

interface LogoItem {
  name: string;
  domain: string;
  color: string;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  rotate: number;
  floatX1: number;
  floatY1: number;
  floatX2: number;
  floatY2: number;
}

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


// Generates a random position outside the "forbidden" center area
function getRandomPosition(isMobile: boolean): { x: number; y: number } {
  const centerMinX = isMobile ? 12 : 25;
  const centerMaxX = isMobile ? 88 : 75;
  const centerMinY = isMobile ? 25 : 20;
  const centerMaxY = isMobile ? 75 : 80;

  let x = 0;
  let y = 0;
  let inCenter = true;

  while (inCenter) {
    x = isMobile ? (8 + Math.random() * 84) : (5 + Math.random() * 90);
    y = isMobile ? (8 + Math.random() * 84) : (5 + Math.random() * 90);

    if (x > centerMinX && x < centerMaxX && y > centerMinY && y < centerMaxY) {
      inCenter = true;
    } else {
      inCenter = false;
    }
  }

  return { x, y };
}

export default function HeroBackground() {
  const [mounted, setMounted] = useState(false);
  const [logoItems, setLogoItems] = useState<LogoItem[]>([]);
  const [starItems, setStarItems] = useState<StarItem[]>([]);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    // Pick random companies to float
    const logoCount = isMobile ? 7 : 14;
    const shuffled = [...companies].sort(() => 0.5 - Math.random()).slice(0, logoCount);

    const generatedLogos: LogoItem[] = [];
    const minDistance = isMobile ? 18 : 12; // Minimum % distance to prevent overlap

    for (let i = 0; i < logoCount; i++) {
      let placed = false;
      let attempts = 0;
      let pos = { x: 0, y: 0 };

      // Collision detection loop
      while (!placed && attempts < 100) {
        pos = getRandomPosition(isMobile);
        let collides = false;

        for (const existing of generatedLogos) {
          const dx = existing.x - pos.x;
          const dy = existing.y - pos.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < minDistance) {
            collides = true;
            break;
          }
        }

        if (!collides) placed = true;
        attempts++;
      }

      const size = isMobile ? Math.random() * 15 + 30 : Math.random() * 25 + 45;
      const floatRange = isMobile ? 35 : 90; // Increased movement range significantly

      generatedLogos.push({
        ...shuffled[i],
        x: pos.x,
        y: pos.y,
        size,
        duration: Math.random() * 15 + 15,    // 15–30 s (Faster float speed for more life)
        delay: -(Math.random() * 40),         // stagger start
        rotate: Math.random() * 24 - 12,      // ±12 deg rotation (More dynamic)
        floatX1: (Math.random() - 0.5) * floatRange,
        floatY1: (Math.random() - 0.5) * floatRange,
        floatX2: (Math.random() - 0.5) * floatRange,
        floatY2: (Math.random() - 0.5) * floatRange,
      });
    }
    
    // Generate starfield
    const generatedStars: StarItem[] = [];
    let starId = 0;
    
    for(let i=0; i<30; i++) {
      generatedStars.push({
        id: starId++, layer: 1,
        top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`,
        width: '2px', height: '2px',
        animationDelay: `${Math.random() * 5}s`, animationDuration: `${2 + Math.random() * 3}s`
      });
    }

    for(let i=0; i<40; i++) {
      generatedStars.push({
        id: starId++, layer: 2,
        top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`,
        width: '1.5px', height: '1.5px',
        animationDelay: `${Math.random() * 5}s`, animationDuration: `${3 + Math.random() * 4}s`
      });
    }

    for(let i=0; i<60; i++) {
      generatedStars.push({
        id: starId++, layer: 3,
        top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`,
        width: '1px', height: '1px',
        animationDelay: `${Math.random() * 5}s`, animationDuration: `${2.5 + Math.random() * 3.5}s`
      });
    }

    setLogoItems(generatedLogos);
    setStarItems(generatedStars);
    setMounted(true);
  }, []);

  // Static placeholder on server — no random values
  if (!mounted) return null;

  // Light mode: render floating logos but hide the original grid pattern
  // if (resolvedTheme !== 'dark') return null;

  return (
    <>


      {/* ── Hero-specific animated layer (absolute, scoped to hero section) ── */}
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
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
      </div>

      {/* Bottom Fade to Page Background */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background to-transparent pointer-events-none z-20" />
    </>
  );
}
