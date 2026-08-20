import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import type { Plugin, UserConfig } from 'vite';
import { defineConfig, loadEnv } from 'vite';
import svgr from 'vite-plugin-svgr';
import { visualizer } from 'rollup-plugin-visualizer';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const { VITE_STATS_ENABLED, VITE_GA_MEASUREMENT_ID } = env;

  const plugins: UserConfig['plugins'] = [
    react(),
    tailwindcss(),
    svgr(),
    googleAnalyticsPlugin(VITE_GA_MEASUREMENT_ID),
  ];

  const server: UserConfig['server'] = {
    ...(mode === 'development' &&
      !process.env['VITE_AUTOMATED_TEST_RUNNING'] && {
        proxy: {
          '/api': {
            target: 'http://localhost:8080',
            changeOrigin: true,
          },
        },
      }),
  };

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
      setupFiles: ['src/test/setup.ts'],
    },
  };
});

const googleAnalyticsPlugin = (measurementId?: string): Plugin => {
  return {
    name: 'vite-plugin-google-analytics',
    transformIndexHtml(html: string) {
      if (!measurementId) return html;
      const gaScript = `
          <script async src="https://www.googletagmanager.com/gtag/js?id=${measurementId}"></script>
          <script>
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${measurementId}');
          </script>
        `;
      return html.replace('<!-- google-analytics-js -->', gaScript);
    },
  };
};
