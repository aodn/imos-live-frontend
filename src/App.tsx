import { Route, Routes } from 'react-router-dom';
import { Layout, ToastProvider } from '@/components';
import { routes } from './routes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      //even though over staltime, react query will not refetch, unless manually trigger or by refetchOnWindowFocus, refetchOnReconnect.
      staleTime: 60 * 1000, //how long the data will become stale.
      gcTime: 5 * 60 * 1000, //how long the data will be removed from cache memory. this should be longer than staltime.
      retry: 2,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      experimental_prefetchInRender: true,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* this will be excluded during a production build*/}
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
      <ToastProvider>
        <Routes>
          <Route element={<Layout />}>
            {routes.map(({ path, element }) => (
              <Route key={path} path={path} element={element} />
            ))}
          </Route>
        </Routes>
      </ToastProvider>
    </QueryClientProvider>
  );
}
export default App;
