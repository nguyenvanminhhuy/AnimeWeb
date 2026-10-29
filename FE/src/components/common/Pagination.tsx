import { Link } from 'react-router-dom';
interface PaginationProps {
  label?: string;
  page: number;
  totalPages: number;
  hrefForPage: (page: number) => string;
}

export function Pagination({
  page,
  totalPages,
  hrefForPage,
  label = 'Phân trang anime',
}: PaginationProps) {
  if (totalPages < 2) return null;
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1).filter(
    (value) => value === 1 || value === totalPages || Math.abs(page - value) <= 1,
  );
  return (
    <nav className="aw-pagination" aria-label={label}>
      {page > 1 ? (
        <Link to={hrefForPage(page - 1)} rel="prev">
          ← Trước
        </Link>
      ) : (
        <span aria-disabled="true">← Trước</span>
      )}
      {pages.map((value, index) => (
        <span className="aw-pagination-item" key={value}>
          {index > 0 && value - pages[index - 1] > 1 && (
            <span className="aw-pagination-gap" aria-hidden="true">
              …
            </span>
          )}
          <Link
            to={hrefForPage(value)}
            aria-label={`Trang ${value}`}
            aria-current={value === page ? 'page' : undefined}
          >
            {value}
          </Link>
        </span>
      ))}
      {page < totalPages ? (
        <Link to={hrefForPage(page + 1)} rel="next">
          Sau →
        </Link>
      ) : (
        <span aria-disabled="true">Sau →</span>
      )}
    </nav>
  );
}
