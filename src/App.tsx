import { Route, Routes } from 'react-router-dom';
import { Layout, ToastProvider } from '@/components';
import { routes } from './routes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      //even though over staltime, react query will not refetch, unless manually trigger or by refetchOnWindowFocus, refetchOnReconnect.
      staleTime: 0,
      // How long the cache exists before get removed
      gcTime: 0,
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
      {/* this will be excluded them during a production build*/}
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="top-right" />
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
