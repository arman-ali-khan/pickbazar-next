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

    // 1. Initial state: at the source, visible
    setStyles({
      position: 'fixed',
      top: `${startRect.top}px`,
      left: `${startRect.left}px`,
      width: `${startRect.width}px`,
      height: `${startRect.height}px`,
      opacity: 1,
      transform: 'scale(1)',
      transition: 'none',
    });
    setIsAnimating(true);

    // 2. Wait for 0.5s
    const pauseTimer = setTimeout(() => {
      // 3. Animate to cart
      setStyles({
        position: 'fixed',
        top: `${endRect.top + endRect.height / 2}px`,
        left: `${endRect.left + endRect.width / 2}px`,
        width: '32px',
        height: '32px',
        opacity: 0,
        transform: 'translate(-50%, -50%)',
        transition: 'all 0.5s cubic-bezier(0.5, 0, 1, 0.5)',
      });
    }, 500);

    // 4. Clean up after animation
    const animationEndTimer = setTimeout(() => {
      setIsAnimating(false);
      clearAnimation();
    }, 1000); // 500ms delay + 500ms transition

    return () => {
      clearTimeout(pauseTimer);
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
