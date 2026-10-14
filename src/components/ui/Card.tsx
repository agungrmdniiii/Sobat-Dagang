import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  extra?: React.ReactNode;
  hoverLift?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  title,
  subtitle,
  extra,
  hoverLift = false,
}) => {
  const content = (
    <div
      className={cn(
        'bg-surface rounded-card border border-ink/10 overflow-hidden shadow-none',
        hoverLift && 'transition-transform duration-200',
        className
      )}
    >
      {(title || extra) && (
        <div className="px-6 py-4 border-b border-ink/10 flex items-center justify-between gap-4">
          <div>
            {title && <h3 className="font-semibold text-lg text-ink tracking-tight">{title}</h3>}
            {subtitle && <p className="text-[13px] text-muted font-normal mt-0.5">{subtitle}</p>}
          </div>
          {extra}
        </div>
      )}
      <div className="p-5 md:p-6">{children}</div>
    </div>
  );

  if (hoverLift) {
    return (
      <motion.div
        whileHover={{ y: -2 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="h-full"
      >
        {content}
      </motion.div>
    );
  }

  return content;
};
