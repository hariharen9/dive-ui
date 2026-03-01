import React from 'react';

interface GradientIconProps {
  Icon: React.ElementType;
  size?: number;
  className?: string;
}

const GradientIcon: React.FC<GradientIconProps> = ({ Icon, size = 20, className = '' }) => {
  const gradientId = `gradient-icon-${Math.random().toString(36).substring(7)}`;

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: '#ffaa40' }} />
          <stop offset="50%" style={{ stopColor: '#9c40ff' }} />
          <stop offset="100%" style={{ stopColor: '#ffaa40' }} />
        </linearGradient>
      </defs>
      <Icon size={size} style={{ fill: `url(#${gradientId})` }} />
    </svg>
  );
};

export default GradientIcon;
