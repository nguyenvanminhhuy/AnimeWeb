import { Selectbox } from '../../../components/ui/Selectbox';
import { Combobox } from '../../../components/ui/Combobox';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Icon } from '../../../components/ui/Icon';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Form } from 'react-router-dom';
import { paths } from '../../../routes/paths';
import { catalogYears, formatOptions, genreOptions, statusOptions } from '../catalogQuery';
import type { CatalogQuery } from '../catalogQuery';

interface ExploreFiltersProps {
  query: CatalogQuery;
  suggestions?: readonly string[];
}
export const exploreFormId = 'explore-search-form';

export function ExploreFilters({ query, suggestions = [] }: ExploreFiltersProps) {
  const [expanded, setExpanded] = useState(() => matchMedia('(min-width: 768px)').matches);
  function submitFilter(event: FormEvent<HTMLSelectElement>) {
    event.currentTarget.form?.requestSubmit();
  }
  return (
    <Form
      id={exploreFormId}
      action={paths.explore}
      method="get"
      className="aw-explore-filters aw-surface tw:p-6 tw:rounded-[12px] tw:max-mobile:p-4"
      role="search"
      aria-label="Tìm và lọc anime"
    >
      <div className="aw-explore-search-row tw:gap-3 tw:flex tw:max-mobile:gap-2">
        <div className="aw-explore-search-field tw:px-4 tw:py-3 tw:gap-3 tw:rounded-[7px] tw:flex tw:items-center tw:flex-1 tw:min-w-0 tw:max-mobile:p-2.5 tw:max-mobile:gap-2">
          <label htmlFor="explore-search" className="visually-hidden">
            Từ khóa anime
          </label>
          <Icon name="search" />
          <Combobox
            variant="unstyled"
            suggestions={suggestions}
            id="explore-search"
            name="q"
            type="search"
            key={query.q}
            defaultValue={query.q}
            maxLength={100}
            placeholder="Tên anime, tên tiếng Anh…"
          />
        </div>
        <Button
          variant="primary"
          type="submit"
          label="Tìm anime"
          endIcon={<Icon name="external-link" size="sm" />}
        />
      </div>
      <Input variant="unstyled" type="hidden" name="page" value="1" />
      <details open={expanded} onToggle={(event) => setExpanded(event.currentTarget.open)}>
        <summary>
          Bộ lọc <span>Thu gọn / Mở rộng</span>
        </summary>
        <div className="aw-explore-filter-grid tw:gap-4.5 tw:grid tw:grid-cols-4 tw:mt-4.25 tw:max-tablet:grid-cols-2">
          <div className="aw-explore-field tw:grid tw:text-body">
            <label htmlFor="explore-genre">Thể loại</label>
            <Selectbox
              id="explore-genre"
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
            </Selectbox>
          </div>
          <div className="aw-explore-field tw:grid tw:text-body">
            <label htmlFor="explore-year">Năm phát hành</label>
            <Selectbox
              id="explore-year"
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
            </Selectbox>
          </div>
          <div className="aw-explore-field tw:grid tw:text-body">
            <label htmlFor="explore-status">Trạng thái</label>
            <Selectbox
              id="explore-status"
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
            </Selectbox>
          </div>
          <div className="aw-explore-field tw:grid tw:text-body">
            <label htmlFor="explore-format">Định dạng</label>
            <Selectbox
              id="explore-format"
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
            </Selectbox>
          </div>
        </div>
      </details>
    </Form>
  );
}
