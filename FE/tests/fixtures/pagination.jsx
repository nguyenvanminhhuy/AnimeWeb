import { createRoot } from 'react-dom/client';
import { BrowserRouter, useSearchParams } from 'react-router-dom';
import { Pagination } from '@/components/common/pagination';
import '@/styles/index.css';

function Fixture() {
  const [params, setParams] = useSearchParams();
  const page = Number(params.get('page') ?? 50);
  const size = params.get('size') ?? 'md';
  return (
    <main className="aw-shell tw:mx-auto">
      <h1>Pagination fixture</h1>
      <Pagination
        label="Test pagination"
        page={page}
        totalPages={Number(params.get('total') ?? 100)}
        size={size}
        siblingCount={Number(params.get('siblings') ?? 1)}
        disabled={params.has('disabled')}
        loading={params.has('loading')}
        showSinglePage={params.has('single')}
        pageSizeControl={
          params.has('pageSize')
            ? {
                value: Number(params.get('pageSize')),
                options: [5, 10, 20],
                onChange: (value) => {
                  const next = new URLSearchParams(params);
                  next.set('pageSize', String(value));
                  next.set('page', '1');
                  setParams(next);
                },
              }
            : undefined
        }
        hrefForPage={(nextPage) => {
          const next = new URLSearchParams(params);
          next.set('page', String(nextPage));
          return '?' + next;
        }}
      />
    </main>
  );
}

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Fixture />
  </BrowserRouter>,
);
