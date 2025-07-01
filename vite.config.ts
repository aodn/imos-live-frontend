import { defineConfig, loadEnv, Plugin } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import svgr from 'vite-plugin-svgr';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  return {
    plugins: [react(), tailwindcss(), svgr(), excludeStorybookFiles()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    //create a proxy for the api to avoid CORS issues
    //this is only for development. /api/aodn will be replaced with target.
    server: {
      proxy: {
        '/api/aodn': {
          target: env.VITE_OGC_BASE_URL,
          changeOrigin: true,
          rewrite: path => path.replace(/^\/api\/aodn/, ''),
        },
      },
    },
  };
});

function excludeStorybookFiles(): Plugin {
  return {
    name: 'exclude-storybook-files',
    load(id) {
      if (id.match(/\.stories\.(t|j)sx?$/) || id.endsWith('.stories.mdx')) {
        return ''; // empty module
      }
      return null;
    },
  };
}
