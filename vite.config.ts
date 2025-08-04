import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { defineConfig, loadEnv, Plugin, UserConfig } from 'vite';
import svgr from 'vite-plugin-svgr';
import { meta, genRandomData as gslaData, inputBitmap, overlayBitmap } from './test-data/gsla';
import { locations, genBuoyRandomData } from './test-data/buoy';
import { visualizer } from 'rollup-plugin-visualizer';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const { VITE_S3_BASE_URL, VITE_STATS_ENABLED } = loadEnv(mode, process.cwd(), '');

  const plugins: UserConfig['plugins'] = [react(), tailwindcss(), svgr(), mockServerPlugin()];

  let define: UserConfig['define'] = {};
  let server: UserConfig['server'] = {};

  if (mode === 'development') {
    define = { 'import.meta.env.VITE_S3_BASE_URL': '"/s3-edge-proxy"' };
    server = {
      proxy: {
        '/s3-edge-proxy': {
          target: VITE_S3_BASE_URL,
          changeOrigin: true,
          rewrite: path => {
            return path.replace(/^\/s3-edge-proxy/, '');
          },
        },
      },
    };
  }

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
    define,
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

          if (!url || !url.startsWith('/data-from-mock-server')) return next();

          if (url.endsWith('json')) res.writeHead(200, { 'Content-Type': 'application/json' });
          if (url.endsWith('png')) res.writeHead(200, { 'Content-Type': 'image/png' });

          if (url.endsWith('gsla_meta.json')) res.end(JSON.stringify(meta()));
          if (url.endsWith('gsla_data.json')) res.end(JSON.stringify(gslaData()));
          if (url.includes('BUOY/buoy_locations')) res.end(JSON.stringify(locations()));
          if (url.includes('BUOY/buoy_details')) {
            const dateMatch = url.match(/BUOY\/buoy_details\/([^_]+)_(\d{4}-\d{2}-\d{2})\.geojson/);
            if (dateMatch) {
              const buoyName = dateMatch[1];
              const dataDate = new Date(dateMatch[2]);
              res.end(JSON.stringify(genBuoyRandomData({ name: buoyName, dataDate })));
            }
          }

          if (url.endsWith('gsla_overlay.png')) res.end(await overlayBitmap());
          if (url.endsWith('gsla_input.png')) res.end(await inputBitmap());
        });
      };
    },
    config: () => ({
      define: {
        'import.meta.env.VITE_S3_BASE_URL': '"/data-from-mock-server"',
      },
    }),

    apply: 'serve',
  };
};
