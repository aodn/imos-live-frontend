import { Map as MapPage, Landing as LandingPage } from '@/pages';

export const routes = [
  { path: '/', name: 'map', element: <MapPage /> },
  { path: '/landing', name: 'landing', element: <LandingPage /> },
] as const;

export type RouteConfig = (typeof routes)[number];
export type PageName = RouteConfig['name'];
export type PathName = RouteConfig['path'];

/**
{
    "/": "map",
    "/landing": "landing"
}
 */
export const routeMap = Object.fromEntries(routes.map(({ path, name }) => [path, name])) as Record<
  PathName,
  PageName
>;
