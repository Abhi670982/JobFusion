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

    setLogoItems(generatedLogos);
    setMounted(true);
  }, []);

  // Static placeholder on server — no random values
  if (!mounted) return null;

  // Light mode: render nothing — let the original page background show
  if (resolvedTheme !== 'dark') return null;

  return (
    <>


      {/* ── Hero-specific animated layer (absolute, scoped to hero section) ── */}
      {/* ── Hero-specific background pattern (absolute, scoped to hero section) ── */}
      <div className="absolute inset-0 pointer-events-none z-0" style={{
        backgroundImage: `
          url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.08'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")
        `,
        backgroundSize: '60px 60px',
        maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)'
      }}>
      </div>
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes floatComplex {
          0%   { transform: translate3d(0, 0, 0) rotate(0deg); }
          33%  { transform: translate3d(var(--fx1), var(--fy1), 0) rotate(var(--rot)); }
          66%  { transform: translate3d(var(--fx2), var(--fy2), 0) rotate(calc(var(--rot) * -1)); }
          100% { transform: translate3d(0, 0, 0) rotate(0deg); }
        }
      ` }} />

      {/* 5. Floating company logos with inline SVG */}
      {logoItems.map((item, i) => (
        <div
          key={i}
          className="absolute flex items-center justify-center rounded-full backdrop-blur-sm"
          style={{
            left: `calc(${item.x}% - ${item.size / 2}px)`,
            top: `calc(${item.y}% - ${item.size / 2}px)`,
            width: `${item.size}px`,
            height: `${item.size}px`,
            background: 'rgba(255,255,255,0.05)',
            border: `1px solid rgba(255,255,255,0.12)`,
            boxShadow: `0 0 18px rgba(56,189,248,0.18), inset 0 0 12px rgba(255,255,255,0.03)`,
            animation: `floatComplex ${item.duration}s ease-in-out infinite`,
            animationDelay: `${item.delay}s`,
            '--fx1': `${item.floatX1}px`,
            '--fy1': `${item.floatY1}px`,
            '--fx2': `${item.floatX2}px`,
            '--fy2': `${item.floatY2}px`,
            '--rot': `${item.rotate}deg`,
          } as React.CSSProperties}
        >
          <div
            style={{
              width: '52%',
              height: '52%',
              opacity: 0.85,
              filter: `drop-shadow(0 0 6px ${item.color}80)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`https://www.google.com/s2/favicons?domain=${item.domain}&sz=128`} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          </div>
        </div>
      ))}

    </div>
    </>
  );
}
