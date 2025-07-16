import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import svgr from 'vite-plugin-svgr';
import { meta, data as gslaData, inputBitmap, overlayBitmap } from './test-data/gsla';
import { locations, data as buoyData } from './test-data/buoy';

// https://vite.dev/config/
export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), svgr(), mockServerPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
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

          if (!url || !url.startsWith('/data-from-mock-server')) return next();

          if (url.endsWith('json')) res.writeHead(200, { 'Content-Type': 'application/json' });
          if (url.endsWith('png')) res.writeHead(200, { 'Content-Type': 'image/png' });

          if (url.endsWith('gsla_meta.json')) res.end(JSON.stringify(meta()));
          if (url.endsWith('gsla_data.json')) res.end(JSON.stringify(gslaData()));
          if (url.includes('BUOY/buoy_locations')) res.end(JSON.stringify(locations()));
          if (url.includes('BUOY/buoy_details')) res.end(JSON.stringify(buoyData()));

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
