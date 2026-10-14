import React, { useEffect, useState } from 'react';

export interface CountUpProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  formatter?: (val: number) => string;
  className?: string;
}

export const CountUp: React.FC<CountUpProps> = ({
  value,
  duration = 700,
  prefix = '',
  suffix = '',
  formatter,
  className,
}) => {
  const [displayValue, setDisplayValue] = useState<number>(() => (typeof value === 'number' && !isNaN(value) ? value : 0));

  useEffect(() => {
    let startTimestamp: number | null = null;
    const startValue = displayValue;
    const targetValue = value;

    if (startValue === targetValue) return;

    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (targetValue - startValue) * ease);

      setDisplayValue(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [value, duration]);

  const formatted = formatter ? formatter(displayValue) : displayValue.toLocaleString('id-ID');

  return (
    <span className={className}>
      {prefix}{formatted}{suffix}
    </span>
  );
};
