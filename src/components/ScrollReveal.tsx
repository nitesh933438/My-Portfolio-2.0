import React from 'react';
import { motion } from 'motion/react';

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
  const getInitialProps = () => {
    switch (direction) {
      case "up": return { y: 40, opacity: 0 };
      case "down": return { y: -40, opacity: 0 };
      case "left": return { x: 40, opacity: 0 };
      case "right": return { x: -40, opacity: 0 };
      default: return { y: 40, opacity: 0 };
    }
  };

  return (
    <motion.div
      variants={{
        hidden: getInitialProps(),
        visible: { y: 0, x: 0, opacity: 1 },
      }}
      initial="hidden"
      whileInView="visible"
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      viewport={{ once: true, amount: 0.1 }}
      className={width === "100%" ? "w-full" : "w-fit"}
    >
      {children}
    </motion.div>
  );
};
