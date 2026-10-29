import { useState } from 'react';
export function Artwork({
  src,
  alt,
  className = '',
  eager = false,
}: {
  src: string;
  alt: string;
  className?: string;
  eager?: boolean;
}) {
  const [broken, setBroken] = useState(false);
  return (
    <img
      className={className}
      src={broken ? '/images/fallback.svg' : src}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      onError={() => setBroken(true)}
    />
  );
}
