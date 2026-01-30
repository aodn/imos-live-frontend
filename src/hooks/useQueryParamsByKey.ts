import { useSearchParams } from 'react-router-dom';

export function useQueryParamsByKey(k: string) {
  const [searchParams] = useSearchParams();
  const v = searchParams.get(k);
  return { isExisted: !!v, value: v };
}
