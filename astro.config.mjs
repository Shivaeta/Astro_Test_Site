import { defineConfig } from 'astro/config';

import react from '@astrojs/react';

export default defineConfig({
  vite: {
      css: {
          postcss: './postcss.config.js',
      },
  },

  integrations: [react()],
});