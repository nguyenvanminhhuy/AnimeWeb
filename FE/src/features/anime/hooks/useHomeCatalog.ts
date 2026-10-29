import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { HomeCatalog } from '../anime.types';
import type { MockState } from '../../../data/contracts/AnimeRepository';
import { animeRepository } from '../../../data/repositories';

export function useHomeCatalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const mock = import.meta.env.DEV ? searchParams.get('mock') : null;
  const state: MockState =
    mock === 'error' || mock === 'empty' || mock === 'loading' ? mock : 'ready';
  const [attempt, setAttempt] = useState(0);
  const key = `${state}:${attempt}`;
  const [response, setResponse] = useState<{
    key: string;
    data: HomeCatalog | null;
    error: string;
  } | null>(null);
  useEffect(() => {
    let active = true;
    if (state !== 'loading')
      animeRepository
        .getHome(state)
        .then((data) => {
          if (active) setResponse({ key, data, error: '' });
        })
        .catch(() => {
          if (active)
            setResponse({ key, data: null, error: 'Không thể tải nội dung. Vui lòng thử lại.' });
        });
    return () => {
      active = false;
    };
  }, [key, state]);
  return {
    data: response?.key === key ? response.data : null,
    error: response?.key === key ? response.error : '',
    retry: () => {
      const next = new URLSearchParams(searchParams);
      next.delete('mock');
      setSearchParams(next, { replace: true, preventScrollReset: true });
      setAttempt((value) => value + 1);
    },
  };
}
