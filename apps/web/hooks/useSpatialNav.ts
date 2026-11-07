'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { TVFocusableNode } from '@/lib/types';

export function useSpatialNav(defaultFocusId?: string) {
  const nodes = useRef<Map<string, TVFocusableNode>>(new Map());
  const [activeFocusId, setActiveFocusId] = useState<string | null>(defaultFocusId || null);

  const registerNode = useCallback((node: TVFocusableNode) => {
    nodes.current.set(node.id, node);

    // Auto-focus first registered node if none active
    setActiveFocusId(prev => {
      if (!prev) return node.id;
      return prev;
    });

    return () => {
      nodes.current.delete(node.id);
    };
  }, []);

  const setFocus = useCallback((id: string) => {
    const node = nodes.current.get(id);
    if (node && node.ref) {
      setActiveFocusId(id);
      node.ref.focus();
      node.ref.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const active = activeFocusId ? nodes.current.get(activeFocusId) : null;
      if (!active) return;

      let nextNode: TVFocusableNode | null = null;

      switch (e.key) {
        case 'ArrowRight': {
          e.preventDefault();
          // Find node in same row with next highest col
          const sameRowNext = Array.from(nodes.current.values())
            .filter(n => n.row === active.row && n.col > active.col)
            .sort((a, b) => a.col - b.col);

          if (sameRowNext.length > 0) {
            nextNode = sameRowNext[0];
          }
          break;
        }

        case 'ArrowLeft': {
          e.preventDefault();
          // Find node in same row with closest lower col
          const sameRowPrev = Array.from(nodes.current.values())
            .filter(n => n.row === active.row && n.col < active.col)
            .sort((a, b) => b.col - a.col);

          if (sameRowPrev.length > 0) {
            nextNode = sameRowPrev[0];
          }
          break;
        }

        case 'ArrowDown': {
          e.preventDefault();
          // Find nodes in rows below
          const rowsBelow = Array.from(nodes.current.values())
            .filter(n => n.row > active.row)
            .sort((a, b) => {
              if (a.row !== b.row) return a.row - b.row;
              return Math.abs(a.col - active.col) - Math.abs(b.col - active.col);
            });

          if (rowsBelow.length > 0) {
            nextNode = rowsBelow[0];
          }
          break;
        }

        case 'ArrowUp': {
          e.preventDefault();
          // Find nodes in rows above
          const rowsAbove = Array.from(nodes.current.values())
            .filter(n => n.row < active.row)
            .sort((a, b) => {
              if (a.row !== b.row) return b.row - a.row;
              return Math.abs(a.col - active.col) - Math.abs(b.col - active.col);
            });

          if (rowsAbove.length > 0) {
            nextNode = rowsAbove[0];
          }
          break;
        }

        case 'Enter':
          e.preventDefault();
          active.onSelect?.();
          return;

        case 'Escape':
        case 'Backspace':
          e.preventDefault();
          active.onBack?.();
          return;

        default:
          // Check for Samsung/LG/Jio STB specific back codes
          if (e.keyCode === 10009 || e.keyCode === 461) {
            e.preventDefault();
            active.onBack?.();
          }
          return;
      }

      if (nextNode) {
        setFocus(nextNode.id);
      }
    },
    [activeFocusId, setFocus]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return {
    activeFocusId,
    setFocus,
    registerNode,
  };
}

