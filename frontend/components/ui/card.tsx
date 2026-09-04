/**
 * REPLACE your existing frontend/components/ui/card.tsx with this file.
 *
 * Adds subtle Framer Motion animations:
 *  - fade+slide in on mount
 *  - lift on hover when `hover` prop is true
 *
 * Requires: npm install framer-motion
 */

'use client';

import { motion } from 'framer-motion';
import { forwardRef } from 'react';

type SafeDivProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart' | 'onAnimationEnd'
>;

interface CardProps extends SafeDivProps {
  hover?: boolean;
  interactive?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', hover = false, interactive = false, children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        whileHover={
          hover
            ? { y: -4, boxShadow: '0 10px 24px rgba(15, 23, 42, 0.08)' }
            : undefined
        }
        className={`
          bg-white rounded-xl border border-slate-200 p-6
          ${interactive ? 'cursor-pointer' : ''}
          ${className}
        `}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

Card.displayName = 'Card';
export default Card;
