import { Route, Routes } from 'react-router-dom';
import { Layout, ToastProvider } from '@/components';
import { routes } from './routes';

function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route element={<Layout />}>
          {routes.map(({ path, element }) => (
            <Route key={path} path={path} element={element} />
          ))}
        </Route>
      </Routes>
    </ToastProvider>
  );
}
export default App;
