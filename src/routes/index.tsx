import { Map as MapPage } from '@/pages';
import { Navigate } from 'react-router-dom';

export const routes = [
  { path: '/', name: 'map', element: <MapPage /> },
  { path: '*', name: 'not-found', element: <Navigate to="/" replace /> },
] as const;

export type RouteConfig = (typeof routes)[number];
export type PageName = RouteConfig['name'];
export type PathName = RouteConfig['path'];
export const routeMap = Object.fromEntries(routes.map(({ path, name }) => [path, name])) as Record<
  PathName,
  PageName
>;
