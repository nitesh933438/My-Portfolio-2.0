import React from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface ScrollRevealProps {
  children: React.ReactNode;
  width?: "fit-content" | "100%";
  delay?: number;
  direction?: "up" | "down" | "left" | "right";
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({ 
  children, 
  width = "100%", 
  delay = 0,
  direction = "up"
}) => {
  const shouldReduceMotion = useReducedMotion();
  const getInitialProps = () => {
    switch (direction) {
      case "up": return { y: 16, opacity: 0 };
      case "down": return { y: -16, opacity: 0 };
      case "left": return { x: 16, opacity: 0 };
      case "right": return { x: -16, opacity: 0 };
      default: return { y: 16, opacity: 0 };
    }
  };

  return (
    <motion.div
      variants={{
        hidden: getInitialProps(),
        visible: { y: 0, x: 0, opacity: 1 },
      }}
      initial={shouldReduceMotion ? false : 'hidden'}
      whileInView={shouldReduceMotion ? undefined : 'visible'}
      transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.28, delay: Math.min(delay, 0.12), ease: [0.22, 1, 0.36, 1] }}
      viewport={{ once: true, amount: 0.05, margin: '0px 0px -20px 0px' }}
      className={`${width === "100%" ? "w-full" : "w-fit"} will-change-transform`}
    >
      {children}
    </motion.div>
  );
};
