import { Link } from 'react-router-dom';
import { Icon } from '@/components/ui/icon';
import type { ControlSize } from '@/types/control';

export interface PaginationProps {
  label?: string;
  page: number;
  totalPages: number;
  hrefForPage: (page: number) => string;
  size?: ControlSize;
  siblingCount?: number;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export function Pagination({
  page,
  totalPages,
  hrefForPage,
  label = 'Phân trang',
  size = 'md',
  siblingCount = 1,
  disabled = false,
  loading = false,
  className = '',
}: PaginationProps) {
  const count = Number.isFinite(totalPages)
    ? Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, Math.trunc(totalPages)))
    : 0;
  if (count < 2) return null;
  const current = Number.isFinite(page) ? Math.min(count, Math.max(1, Math.trunc(page))) : 1;
  const siblings = Number.isFinite(siblingCount)
    ? Math.min(3, Math.max(0, Math.trunc(siblingCount)))
    : 1;
  const visible = new Set([1, count]);
  for (let offset = -siblings; offset <= siblings; offset++) {
    const value = current + offset;
    if (value >= 1 && value <= count) visible.add(value);
  }
  const pages = [...visible].sort((a, b) => a - b);
  const blocked = disabled || loading;
  const iconSize = size === 'lg' ? 'md' : 'sm';
  return (
    <nav
      className={['aw-pagination', `aw-pagination-${size}`, className].filter(Boolean).join(' ')}
      aria-label={label}
      aria-busy={loading || undefined}
    >
      {current > 1 && !blocked ? (
        <Link to={hrefForPage(current - 1)} rel="prev">
          <Icon name="arrow-left" size={iconSize} /> Trước
        </Link>
      ) : (
        <span aria-disabled="true">
          <Icon name="arrow-left" size={iconSize} /> Trước
        </span>
      )}
      {pages.map((value, index) => (
        <span className="aw-pagination-item" key={value}>
          {index > 0 && value - pages[index - 1] > 1 && (
            <span className="aw-pagination-gap" aria-hidden="true">
              …
            </span>
          )}
          {blocked ? (
            <span
              aria-label={`Trang ${value}`}
              aria-disabled="true"
              aria-current={value === current ? 'page' : undefined}
            >
              {value}
            </span>
          ) : (
            <Link
              to={hrefForPage(value)}
              aria-label={`Trang ${value}`}
              aria-current={value === current ? 'page' : undefined}
            >
              {value}
            </Link>
          )}
        </span>
      ))}
      {current < count && !blocked ? (
        <Link to={hrefForPage(current + 1)} rel="next">
          Sau <Icon name="arrow-right" size={iconSize} />
        </Link>
      ) : (
        <span aria-disabled="true">
          Sau <Icon name="arrow-right" size={iconSize} />
        </span>
      )}
    </nav>
  );
}
