import type { StorybookConfig } from '@storybook/react-vite';
import path from 'path';
import { mergeConfig } from 'vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],

  addons: [
    '@storybook/addon-essentials',
    '@chromatic-com/storybook',
    '@storybook/experimental-addon-test',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  async viteFinal(config) {
    // Merge custom configuration into the default Vite config
    return mergeConfig(config, {
      // Add your own Vite options here
      resolve: {
        alias: {
          // Example: if your tsconfig.json has paths: { "@/*": ["src/*"] }
          '@': path.resolve(__dirname, '../src'), // Adjust path as needed
        },
      },
    });
  },
};
export default config;
