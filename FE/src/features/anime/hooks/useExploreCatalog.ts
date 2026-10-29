import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { CatalogResult } from '../anime.types';
import type { MockState } from '../../../data/contracts/AnimeRepository';
import { catalogHref, catalogParams, parseCatalogQuery } from '../catalogQuery';
import { animeRepository } from '../../../data/repositories';
import { paths } from '../../../routes/paths';

export function useExploreCatalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryString = catalogParams(parseCatalogQuery(searchParams)).toString();
  const query = useMemo(() => parseCatalogQuery(new URLSearchParams(queryString)), [queryString]);
  const mock = import.meta.env.DEV ? searchParams.get('mock') : null;
  const state: MockState =
    mock === 'loading' || mock === 'empty' || mock === 'error' ? mock : 'ready';
  const [attempt, setAttempt] = useState(0);
  const requestKey = `${queryString}:${state}:${attempt}`;
  const [response, setResponse] = useState<{
    key: string;
    resolvedKey: string;
    result: CatalogResult | null;
    error: string;
  } | null>(null);
  const matches = response?.key === requestKey || response?.resolvedKey === requestKey;
  const result = matches && response ? response.result : null;
  const error = matches && response ? response.error : '';
  const canonicalHref = result ? catalogHref({ ...query, page: result.meta.page }, mock) : null;
  const currentSearch = searchParams.toString();

  useEffect(() => {
    if (response?.key === requestKey || response?.resolvedKey === requestKey) return;
    let active = true;
    if (state !== 'loading') {
      animeRepository
        .list(query, state)
        .then((data) => {
          if (active)
            setResponse({
              key: requestKey,
              resolvedKey: `${catalogParams({ ...query, page: data.meta.page })}:${state}:${attempt}`,
              result: data,
              error: '',
            });
        })
        .catch(() => {
          if (active)
            setResponse({
              key: requestKey,
              resolvedKey: requestKey,
              result: null,
              error: 'Không thể tải danh mục anime. Vui lòng thử lại.',
            });
        });
    }
    return () => {
      active = false;
    };
  }, [query, state, requestKey, response, attempt]);

  useEffect(() => {
    if (canonicalHref && canonicalHref !== `${paths.explore}?${currentSearch}`) {
      navigate(canonicalHref, { replace: true, preventScrollReset: true });
    }
  }, [canonicalHref, currentSearch, navigate]);

  return {
    query: { ...query, page: result?.meta.page ?? query.page },
    result,
    error,
    mock,
    retry: () => {
      const next = new URLSearchParams(searchParams);
      next.delete('mock');
      setSearchParams(next, { replace: true, preventScrollReset: true });
      setAttempt((value) => value + 1);
    },
  };
}
