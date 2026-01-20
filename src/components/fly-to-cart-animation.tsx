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

    // 1. Initial state: at the source, visible
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
    
    // Using a minimal timeout to force a reflow and ensure the initial state is painted before applying the transition.
    const timer = setTimeout(() => {
        setStyles({
            position: 'fixed',
            top: `${endRect.top + endRect.height / 2}px`,
            left: `${endRect.left + endRect.width / 2}px`,
            width: '32px',
            height: '32px',
            opacity: 0,
            transform: 'translate(-50%, -50%) scale(0.2)',
            transition: 'all 0.5s cubic-bezier(0.5, 0, 1, 0.5)',
            transitionDelay: '0.5s', // Pause for 0.5s using CSS transition-delay
        });
    }, 20); // A small 20ms delay is enough to trigger the reflow

    // 4. Clean up after animation (pause + duration)
    const animationEndTimer = setTimeout(() => {
      setIsAnimating(false);
      clearAnimation();
    }, 1020); // 500ms pause + 500ms transition + 20ms buffer

    return () => {
      clearTimeout(timer);
      clearTimeout(animationEndTimer);
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
