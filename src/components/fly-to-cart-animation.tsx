'use client';

import { useCart } from '@/contexts/cart-context';
import Image from 'next/image';
import { useEffect, useState } from 'react';

export default function FlyToCartAnimation() {
  const { animationState, clearAnimation } = useCart();
  const [isAnimating, setIsAnimating] = useState(false);
  const [styles, setStyles] = useState<React.CSSProperties>({});
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (!animationState || animationState.key === key) {
      return;
    }
    setKey(animationState.key);

    const cartButton = document.getElementById('cart-trigger-button');
    if (!cartButton) return;

    const endRect = cartButton.getBoundingClientRect();
    const startRect = animationState.startRect;

    const size = 100;
    const initialTop = startRect.top + startRect.height / 2 - size / 2;
    const initialLeft = startRect.left + startRect.width / 2 - size / 2;

    // 1. Initial state: at the source, visible, with no transition.
    setStyles({
      position: 'fixed',
      top: `${initialTop}px`,
      left: `${initialLeft}px`,
      width: `${size}px`,
      height: `${size}px`,
      opacity: 1,
      transform: 'scale(1)',
      transition: 'none',
    });
    setIsAnimating(true);
    
    // 2. After a 500ms pause, apply the animation styles.
    const animationTimer = setTimeout(() => {
        setStyles({
            position: 'fixed',
            top: `${endRect.top + endRect.height / 2}px`,
            left: `${endRect.left + endRect.width / 2}px`,
            width: '32px',
            height: '32px',
            opacity: 0,
            transform: 'translate(-50%, -50%) scale(0.2)',
            transition: 'all 0.5s cubic-bezier(0.5, 0, 1, 0.5)',
        });
    }, 500); // 500ms pause before animation starts

    // 3. Clean up after the entire sequence is over (500ms pause + 500ms animation).
    const cleanupTimer = setTimeout(() => {
      setIsAnimating(false);
      clearAnimation();
    }, 1000);

    return () => {
      clearTimeout(animationTimer);
      clearTimeout(cleanupTimer);
    };
  }, [animationState, clearAnimation, key]);

  if (!isAnimating || !animationState) {
    return null;
  }

  return (
    <div style={styles} className="z-[999] rounded-full overflow-hidden shadow-2xl bg-white">
      <Image
        src={animationState.imageSrc}
        alt="Adding to cart"
        data-ai-hint={animationState.imageHint}
        width={100}
        height={100}
        className="w-full h-full object-contain p-1"
      />
    </div>
  );
}
