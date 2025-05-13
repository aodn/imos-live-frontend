import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  console.log(env.VITE_OGC_BASE_URL);
  return {
    plugins: [react()],
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
