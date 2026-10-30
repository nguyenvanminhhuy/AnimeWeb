import type { ControlSize } from '@/types/control';

export function Avatar({ name, size = 'md' }: { name: string; size?: ControlSize }) {
  const words = name.normalize('NFC').trim().split(/\s+/).filter(Boolean);
  const initials = (
    words.length > 1 ? words[0][0] + words.at(-1)![0] : (words[0]?.slice(0, 2) ?? 'TK')
  ).toLocaleUpperCase('vi-VN');
  const sizes = {
    sm: 'tw:w-8 tw:h-8 tw:text-body',
    md: 'tw:w-9 tw:h-9 tw:text-body',
    lg: 'tw:w-20 tw:h-20 tw:text-3xl',
  };
  return (
    <span
      aria-hidden="true"
      className={`tw:inline-flex tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:bg-[#a697ff25] tw:border tw:border-[#a697ff55] tw:text-[#c5baff] tw:font-semibold ${sizes[size]}`}
    >
      {initials}
    </span>
  );
}
