import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import type { Plugin, UserConfig } from 'vite';
import { defineConfig, loadEnv } from 'vite';
import svgr from 'vite-plugin-svgr';
import { meta, genRandomData as gslaData, inputBitmap, rasterBitmap } from './test-data/gsla';
import { locations, genBuoyRandomData } from './test-data/buoy';
import { visualizer } from 'rollup-plugin-visualizer';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const { VITE_STATS_ENABLED } = env;

  const plugins: UserConfig['plugins'] = [
    react(),
    tailwindcss(),
    svgr(),
    mockServerPlugin(),
    googleAnalyticsPlugin(mode),
  ];

  // In dev, proxy the wave-buoy REST endpoint through the portal so the browser
  // can call it as a same-origin `/api/...` URL. `MOCKDATA=true` shuts the
  // proxy off and the mock middleware below serves canned responses instead.
  // Tile / manifest traffic uses an absolute URL configured via
  // `VITE_TILE_BASE_URL` (see `.env.example`), so no proxy is needed for it.
  const server: UserConfig['server'] =
    mode === 'development' && !process.env['MOCKDATA']
      ? {
          proxy: {
            '/api': {
              target: 'https://portal.edge.aodn.org.au',
              changeOrigin: true,
            },
          },
        }
      : {};

  if (VITE_STATS_ENABLED === 'true') {
    plugins.push(
      visualizer({
        filename: 'dist/stats.html',
        template: 'treemap',
        gzipSize: true,
        brotliSize: true,
        open: true,
      }),
    );
  }

  return {
    plugins,
    server,
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/mapbox-gl')) {
              return 'mapbox';
            }

            if (id.includes('node_modules') && !id.includes('node_modules/highcharts')) {
              return 'vendor';
            }
          },
        },
      },
    },
    // define,
    test: {
      include: ['src/**/*.spec.ts', 'src/**/*.spec.tsx'],
    },
  };
});

const mockServerPlugin = (): Plugin => {
  if (!process.env['MOCKDATA']) return { name: 'configure-preview-server' };
  return {
    name: 'configure-preview-server',
    configureServer(server) {
      return () => {
        server.middlewares.use(async (req, res, next) => {
          const url = req.originalUrl || req.url;

          if (!url || (!url.startsWith('/data') && !url.startsWith('/api'))) return next();

          if (url.endsWith('png')) res.writeHead(200, { 'Content-Type': 'image/png' });
          else res.writeHead(200, { 'Content-Type': 'application/json' });

          if (url.endsWith('gsla_meta.json')) res.end(JSON.stringify(meta()));
          if (url.endsWith('gsla_data.json')) res.end(JSON.stringify(gslaData()));

          if (url.includes('items/first_data_available')) {
            res.end(JSON.stringify(locations()));
          }
          if (url.includes('items/timeseries')) {
            const timeseriesURL = new URL(url, `http://${req.headers.host}`);
            const buoyName = timeseriesURL.searchParams.get('waveBuoy') ?? '';
            const [from, to] = timeseriesURL.searchParams.get('datetime')?.split('/') || [];
            res.end(
              JSON.stringify(
                genBuoyRandomData({ name: buoyName, from: new Date(from), to: new Date(to) }),
              ),
            );
          }

          if (url.endsWith('gsla_overlay.png')) res.end(await rasterBitmap());
          if (url.endsWith('gsla_input.png')) res.end(await inputBitmap());
        });
      };
    },
    apply: 'serve',
  };
};

const googleAnalyticsPlugin = (mode: string) => {
  const { VITE_GA_MEASUREMENT_ID } = loadEnv(mode, process.cwd(), '');
  return {
    name: 'vite-plugin-google-analytics',
    transformIndexHtml(html: string) {
      if (!VITE_GA_MEASUREMENT_ID) return html;
      const gaScript = `
          <script async src="https://www.googletagmanager.com/gtag/js?id=${VITE_GA_MEASUREMENT_ID}"></script>
          <script>
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${VITE_GA_MEASUREMENT_ID}');
          </script>
        `;
      return html.replace('<!-- google-analytics-js -->', gaScript);
    },
  };
};
