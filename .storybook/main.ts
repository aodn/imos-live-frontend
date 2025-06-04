// import type { StorybookConfig } from '@storybook/react-vite';

// const config: StorybookConfig = {
//   stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],

//   addons: [
//     '@storybook/addon-essentials',
//     '@chromatic-com/storybook',
//     '@storybook/experimental-addon-test',
//   ],
//   framework: {
//     name: '@storybook/react-vite',
//     options: {},
//   },

// };
// export default config;

import { StorybookConfig } from '@storybook/react-vite';
import path from 'path';

const config: StorybookConfig = {
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  core: {
    builder: '@storybook/builder-vite',
  },
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@chromatic-com/storybook',
    '@storybook/experimental-addon-test',
  ],
  stories: ['../src/**/*.stories.@(ts|tsx|js|jsx|mdx)'],
  viteFinal: async config => {
    // Inject your alias from vite.config manually
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@': path.resolve(__dirname, '../src'),
    };
    return config;
  },
};

export default config;
