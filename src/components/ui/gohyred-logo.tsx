'use client';

import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface GohyredLogoProps {
  /** 'full' displays icon + white "Gohyred" text. 'icon' displays only the icon symbol. */
  variant?: 'full' | 'icon';
  /** Preset size: 'sm' (24px icon), 'md' (32px icon), 'lg' (40px icon), 'xl' (48px icon), or custom px number */
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
  /** Optional link destination (e.g. "/") */
  href?: string;
  /** Optional className for container styling */
  className?: string;
  /** Whether to hide text on mobile screens (default: false, keeps full brand lockup) */
  hideTextOnMobile?: boolean;
  /** Optional click handler */
  onClick?: (e: React.MouseEvent<HTMLAnchorElement | HTMLDivElement>) => void;
}

export function GohyredLogo({
  variant = 'full',
  size = 'md',
  href,
  className,
  hideTextOnMobile = false,
  onClick,
}: GohyredLogoProps) {
  let iconSize = 32;
  let textSizeClass = 'text-xl';
  let gapClass = 'gap-2.5';

  if (typeof size === 'number') {
    iconSize = size;
    textSizeClass = size < 28 ? 'text-lg' : size < 40 ? 'text-xl' : 'text-2xl';
  } else {
    switch (size) {
      case 'sm':
        iconSize = 24;
        textSizeClass = 'text-base sm:text-lg';
        gapClass = 'gap-2';
        break;
      case 'md':
        iconSize = 32;
        textSizeClass = 'text-lg sm:text-xl';
        gapClass = 'gap-2.5';
        break;
      case 'lg':
        iconSize = 40;
        textSizeClass = 'text-xl sm:text-2xl';
        gapClass = 'gap-3';
        break;
      case 'xl':
        iconSize = 48;
        textSizeClass = 'text-2xl sm:text-3xl';
        gapClass = 'gap-3.5';
        break;
    }
  }

  const content = (
    <div className={cn('inline-flex items-center group select-none', gapClass, className)}>
      {/* 1. BLUE GEOMETRIC HEXAGONAL KEYHOLE LOGO ICON (No circle background) */}
      <Image
        src="/gohyred-icon.png"
        alt="Gohyred Icon"
        width={iconSize}
        height={iconSize}
        priority
        className="object-contain flex-shrink-0 group-hover:scale-105 transition-transform duration-200"
        style={{ width: iconSize, height: iconSize }}
      />

      {/* 2. PURE WHITE BOLD WORDMARK */}
      {variant === 'full' && (
        <span
          className={cn(
            'font-bold tracking-tight text-white transition-opacity duration-200',
            textSizeClass,
            hideTextOnMobile && 'hidden sm:inline-block'
          )}
          style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}
        >
          Gohyred
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} onClick={onClick} className="inline-flex items-center focus:outline-none">
        {content}
      </Link>
    );
  }

  return content;
}

export default GohyredLogo;
