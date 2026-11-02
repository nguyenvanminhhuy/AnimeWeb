import { isMockApi } from '@/config/api';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { genreOptions } from '@/config/catalog';
import type { HomeCatalog } from '@/types/anime';
import type { MockState } from '@/lib/api/contracts/anime-repository';
import { animeRepository } from '@/lib/api/repositories';

export function useHomeCatalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const mock = isMockApi ? searchParams.get('mock') : null;
  const state: MockState =
    mock === 'error' || mock === 'empty' || mock === 'loading' ? mock : 'ready';
  const genre = genreOptions.find((option) => option.label === searchParams.get('genre'))?.value;
  const [attempt, setAttempt] = useState(0);
  const key = `${state}:${attempt}:${genre ?? ''}`;
  const [response, setResponse] = useState<{
    key: string;
    data: HomeCatalog | null;
    error: string;
  } | null>(null);
  useEffect(() => {
    let active = true;
    if (state !== 'loading')
      animeRepository
        .getHome(state, genre)
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
  }, [key, state, genre]);
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
