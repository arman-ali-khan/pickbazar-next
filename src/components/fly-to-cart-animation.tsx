'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { clearAnimation } from '@/lib/redux/slices/cartSlice';

type AnimationPhase = 'idle' | 'start' | 'flying' | 'done';

export default function FlyToCartAnimation() {
  const dispatch = useAppDispatch();
  const animationState = useAppSelector(state => state.cart.animationState);
  const [phase, setPhase] = useState<AnimationPhase>('idle');
  const [styles, setStyles] = useState<React.CSSProperties>({});
  const isMobile = useIsMobile();
  
  // Effect to start the animation sequence
  useEffect(() => {
    if (animationState) {
      const cartButtonId = isMobile ? 'cart-icon-mobile' : 'cart-trigger-button';
      const cartButton = document.getElementById(cartButtonId);

      if (!cartButton) return;

      const startRect = animationState.startRect;
      const size = 100;
      const initialTop = startRect.top + startRect.height / 2 - size / 2;
      const initialLeft = startRect.left + startRect.width / 2 - size / 2;

      setStyles({
        position: 'fixed',
        top: `${initialTop}px`,
        left: `${initialLeft}px`,
        width: `${size}px`,
        height: `${size}px`,
        opacity: 1,
        transform: 'scale(1)',
        transition: 'none', // Important: No transition for initial placement
      });
      setPhase('start');
    }
  }, [animationState, isMobile]);

  // Effect to control the animation phases
  useEffect(() => {
    if (phase === 'start') {
      // After being placed, wait for the pause duration, then start flying.
      const pauseTimer = setTimeout(() => {
        setPhase('flying');
      }, 500); // 0.5s pause
      return () => clearTimeout(pauseTimer);

    } else if (phase === 'flying') {
      const cartButtonId = isMobile ? 'cart-icon-mobile' : 'cart-trigger-button';
      const cartButton = document.getElementById(cartButtonId);
      if (!cartButton || !animationState) return;
      
      const endRect = cartButton.getBoundingClientRect();

      // Apply final styles to trigger the animation
      setStyles(prev => ({
        ...prev,
        top: `${endRect.top + endRect.height / 2}px`,
        left: `${endRect.left + endRect.width / 2}px`,
        width: '32px',
        height: '32px',
        opacity: 1,
        transform: 'translate(-50%, -50%) scale(0.5)',
        transition: 'all 0.5s cubic-bezier(0, 0, 0, 0)',
      }));

      // After animation duration, mark as done
      const flyTimer = setTimeout(() => {
        setPhase('done');
      }, 500); // Animation duration
      return () => clearTimeout(flyTimer);

    } else if (phase === 'done') {
      // Clean up
      dispatch(clearAnimation());
      setPhase('idle');
    }
  }, [phase, animationState, dispatch, isMobile]);

  if (phase === 'idle' || !animationState) {
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
