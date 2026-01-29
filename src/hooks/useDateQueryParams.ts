import { useSearchParams } from 'react-router-dom';

export function useDateQueryParams() {
  const [searchParams] = useSearchParams();
  const date = searchParams.get('date');
  return { isDateInQueryParams: !!date };
}
