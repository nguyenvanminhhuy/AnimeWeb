import { useState } from 'react';
import type { FormEvent } from 'react';
import { Form } from 'react-router-dom';
import { paths } from '../../../routes/paths';
import { catalogYears, formatOptions, genreOptions, statusOptions } from '../catalogQuery';
import type { CatalogQuery } from '../catalogQuery';

interface ExploreFiltersProps {
  query: CatalogQuery;
}
export const exploreFormId = 'explore-search-form';

export function ExploreFilters({ query }: ExploreFiltersProps) {
  const [expanded, setExpanded] = useState(() => matchMedia('(min-width: 768px)').matches);
  function submitFilter(event: FormEvent<HTMLSelectElement>) {
    event.currentTarget.form?.requestSubmit();
  }
  return (
    <Form
      id={exploreFormId}
      action={paths.explore}
      method="get"
      className="aw-explore-filters aw-surface"
      role="search"
      aria-label="Tìm và lọc anime"
    >
      <div className="aw-explore-search-row">
        <div className="aw-explore-search-field">
          <label htmlFor="explore-search" className="visually-hidden">
            Từ khóa anime
          </label>
          <span aria-hidden="true">⌕</span>
          <input
            id="explore-search"
            name="q"
            type="search"
            key={query.q}
            defaultValue={query.q}
            maxLength={100}
            placeholder="Tên anime, tên tiếng Anh…"
          />
        </div>
        <button className="btn aw-btn-primary" type="submit">
          Tìm anime <span aria-hidden="true">↗</span>
        </button>
      </div>
      <input type="hidden" name="page" value="1" />
      <details open={expanded} onToggle={(event) => setExpanded(event.currentTarget.open)}>
        <summary>
          Bộ lọc <span>Thu gọn / Mở rộng</span>
        </summary>
        <div className="aw-explore-filter-grid">
          <div className="aw-explore-field">
            <label htmlFor="explore-genre">Thể loại</label>
            <select
              id="explore-genre"
              className="form-select"
              name="genre"
              key={query.genre}
              defaultValue={query.genre}
              onChange={submitFilter}
            >
              <option value="">Tất cả thể loại</option>
              {genreOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="aw-explore-field">
            <label htmlFor="explore-year">Năm phát hành</label>
            <select
              id="explore-year"
              className="form-select"
              name="year"
              key={query.year}
              defaultValue={query.year}
              onChange={submitFilter}
            >
              <option value="">Tất cả năm</option>
              {catalogYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          <div className="aw-explore-field">
            <label htmlFor="explore-status">Trạng thái</label>
            <select
              id="explore-status"
              className="form-select"
              name="status"
              key={query.status}
              defaultValue={query.status}
              onChange={submitFilter}
            >
              <option value="">Tất cả trạng thái</option>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="aw-explore-field">
            <label htmlFor="explore-format">Định dạng</label>
            <select
              id="explore-format"
              className="form-select"
              name="format"
              key={query.format}
              defaultValue={query.format}
              onChange={submitFilter}
            >
              <option value="">Tất cả định dạng</option>
              {formatOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </details>
    </Form>
  );
}
