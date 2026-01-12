import { Route, Routes } from 'react-router-dom';
import { Layout } from '@/components';
import { routes } from './routes';

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {routes.map(({ path, element }) => (
          <Route key={path} path={path} element={element} />
        ))}
      </Route>
    </Routes>
  );
}
export default App;
