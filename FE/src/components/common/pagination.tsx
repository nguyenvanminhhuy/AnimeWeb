import { useId } from 'react';
import { Link } from 'react-router-dom';
import { Selectbox } from '@/components/ui/selectbox';
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
  showSinglePage?: boolean;
  pageSizeControl?: {
    value: number;
    options: readonly number[];
    onChange: (value: number) => void;
    label?: string;
  };
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
  showSinglePage = false,
  pageSizeControl,
}: PaginationProps) {
  const pageSizeId = useId();
  const count = Number.isFinite(totalPages)
    ? Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, Math.trunc(totalPages)))
    : 0;
  if (count < 2 && !showSinglePage && !pageSizeControl) return null;
  const current = Number.isFinite(page)
    ? Math.min(Math.max(1, count), Math.max(1, Math.trunc(page)))
    : 1;
  const siblings = Number.isFinite(siblingCount)
    ? Math.min(3, Math.max(0, Math.trunc(siblingCount)))
    : 1;
  const visible = new Set(count > 0 ? [1, count] : []);
  for (let offset = -siblings; offset <= siblings; offset++) {
    const value = current + offset;
    if (value >= 1 && value <= count) visible.add(value);
  }
  const pages = [...visible].sort((a, b) => a - b);
  const blocked = disabled || loading;
  const iconSize = size === 'lg' ? 'md' : 'sm';
  return (
    <div
      className={[
        pageSizeControl
          ? 'tw:grid tw:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] tw:items-center tw:gap-4 tw:max-tablet:grid-cols-1'
          : 'tw:flex tw:items-center tw:justify-center',
        pageSizeControl || showSinglePage ? className : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <nav
        className={[
          'aw-pagination',
          `aw-pagination-${size}`,
          pageSizeControl ? 'tw:col-start-2 tw:max-tablet:col-start-1' : '',
          pageSizeControl || showSinglePage ? 'tw:mt-0' : className,
        ]
          .filter(Boolean)
          .join(' ')}
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
      {pageSizeControl && (
        <div className="tw:justify-self-end tw:flex tw:flex-wrap tw:justify-end tw:items-center tw:gap-3 tw:min-w-0">
          <label htmlFor={pageSizeId}>{pageSizeControl.label ?? 'Số bản ghi mỗi trang'}</label>
          <Selectbox
            id={pageSizeId}
            size={size}
            value={String(pageSizeControl.value)}
            disabled={blocked}
            onChange={(event) => pageSizeControl.onChange(Number(event.target.value))}
            options={pageSizeControl.options.map((value) => ({
              value: String(value),
              label: String(value),
            }))}
            className="tw:w-auto"
          />
        </div>
      )}
    </div>
  );
}
