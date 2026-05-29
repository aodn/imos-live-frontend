// Polyfills loaded before any test module is imported. Keep this list minimal
// — only add a polyfill if a *module-init-time* browser API call would otherwise
// crash the import (i.e. a `const x = something(window)` at file top level).

if (typeof window !== 'undefined' && !window.matchMedia) {
  // useDrawerStore calls `isSmallScreen()` at module init, which reaches
  // `window.matchMedia`. jsdom doesn't implement it.
  Object.defineProperty(window, 'matchMedia', {
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
    writable: true,
  });
}
