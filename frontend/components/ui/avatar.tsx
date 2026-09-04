

'use client';

import { useState } from 'react';

interface AvatarProps {
  name?: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  online?: boolean;
  className?: string;
  variant?: 'illustrated' | 'initials';
}

const sizeStyles = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-20 h-20 text-2xl',
};

const dotSizeStyles = {
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-3 h-3',
  xl: 'w-4 h-4',
};

export default function Avatar({
  name = '',
  src,
  size = 'md',
  online,
  className = '',
  variant = 'illustrated',
}: AvatarProps) {
  const [imgFailed, setImgFailed] = useState(false);

  const initials = name
    .split(' ')
    .map((n) => n.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const diceBearUrl = name
    ? `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(
      name
    )}&backgroundColor=dbeafe,ede9fe,d1fae5`
    : null;

  const imageSource = src || (variant === 'illustrated' ? diceBearUrl : null);
  const showImage = imageSource && !imgFailed;

  return (
    <div className={`relative inline-block ${className}`}>
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageSource}
          alt={name}
          onError={() => setImgFailed(true)}
          className={`${sizeStyles[size]} rounded-full object-cover bg-slate-100`}
        />
      ) : (
        <div
          className={`
            ${sizeStyles[size]} rounded-full bg-blue-600 text-white
            flex items-center justify-center font-semibold
          `}
        >
          {initials || '?'}
        </div>
      )}
      {online !== undefined && (
        <span
          className={`
            absolute bottom-0 right-0 rounded-full border-2 border-white
            ${dotSizeStyles[size]}
            ${online ? 'bg-emerald-500' : 'bg-slate-300'}
          `}
        />
      )}
    </div>
  );
}
