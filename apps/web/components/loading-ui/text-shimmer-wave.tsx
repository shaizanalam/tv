'use client';

import React from 'react';
import { motion, Transition } from 'framer-motion';

export interface TextShimmerWaveProps {
  children: string;
  as?: React.ElementType;
  className?: string;
  duration?: number;
  zDistance?: number;
  xDistance?: number;
  yDistance?: number;
  spread?: number;
  scaleDistance?: number;
  rotateYDistance?: number;
  transition?: Transition;
}

export function TextShimmerWave({
  children,
  className = '',
  duration = 1.2,
  zDistance = 10,
  xDistance = 0,
  yDistance = -4,
  spread = 1.2,
  scaleDistance = 1.08,
  rotateYDistance = 0,
  transition,
}: TextShimmerWaveProps) {
  const letters = Array.from(children);

  return (
    <span className={`inline-flex items-center select-none font-sans tracking-wide ${className}`}>
      {letters.map((char, i) => {
        const delay = (i * (duration / Math.max(1, letters.length))) * (1 / spread);

        return (
          <motion.span
            key={i}
            initial={{
              opacity: 0.4,
              y: 0,
              scale: 1,
            }}
            animate={{
              opacity: [0.4, 1, 0.4],
              y: [0, yDistance, 0],
              scale: [1, scaleDistance, 1],
              color: ['#A3A6AD', '#D8C6A1', '#A3A6AD'],
            }}
            transition={{
              duration,
              repeat: Infinity,
              repeatType: 'loop',
              delay,
              ease: 'easeInOut',
              ...transition,
            }}
            className="inline-block"
            style={{
              whiteSpace: char === ' ' ? 'pre' : 'normal',
              textShadow: '0 2px 10px rgba(216,198,161,0.25)',
            }}
          >
            {char}
          </motion.span>
        );
      })}
    </span>
  );
}

export function TextShimmerWaveDemo() {
  return (
    <TextShimmerWave className="text-xl font-medium">Alam&apos;s</TextShimmerWave>
  );
}

