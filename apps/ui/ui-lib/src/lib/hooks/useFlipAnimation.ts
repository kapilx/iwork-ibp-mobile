import { MutableRefObject, useLayoutEffect, useRef, useCallback } from 'react';

export function useFlipAnimation<T extends HTMLElement>(
  key: string | number,
  isCompleted?: boolean
): MutableRefObject<T | null> {
  const ref = useRef<T | null>(null);
  const prevPositions = useRef<Map<string | number, DOMRect>>(new Map());
  const prevComplete = useRef<boolean | undefined>(undefined);

  const animateNode = useCallback((node: T, first: DOMRect, last: DOMRect, hasStatusChanged: boolean) => {
    const deltaX = first.left - last.left;
    const deltaY = first.top - last.top;

    if (deltaX || deltaY || hasStatusChanged) {
      requestAnimationFrame(() => {
        // Apply initial position
        node.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
        node.style.transition = 'transform 0s';

        if (hasStatusChanged) {
          // Add flip animation when status changes
          node.style.transform += isCompleted 
            ? ' perspective(1000px) rotateX(-180deg)' 
            : ' perspective(1000px) rotateX(0deg)';
          node.style.transition = 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)';
        }

        requestAnimationFrame(() => {
          // Animate to final position
          node.style.transform = isCompleted 
            ? 'perspective(1000px) rotateX(-180deg)' 
            : 'perspective(1000px) rotateX(0deg)';
          node.style.transition = 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)';
        });
      });
    }
  }, [isCompleted]);

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;

    const hasStatusChanged = prevComplete.current !== isCompleted;
    const prevRect = prevPositions.current.get(key);
    const newRect = node.getBoundingClientRect();

    if (prevRect) {
      animateNode(node, prevRect, newRect, hasStatusChanged);
    }

    prevPositions.current.set(key, newRect);
    prevComplete.current = isCompleted;

    return () => {
      prevPositions.current.delete(key);
      if (node) {
        node.style.transform = '';
        node.style.transition = '';
      }
    };
  }, [key, isCompleted, animateNode]);

  return ref;
}
