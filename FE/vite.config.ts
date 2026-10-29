import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // Let Vite optimize after PostCSS normalizes imported Bootstrap CSS.
  plugins: [react(), tailwindcss({ optimize: false })],
  // The FE never needs secrets from .env files during local setup.
  envDir: false,
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [{ name: 'fontawesome', test: /[\\/]node_modules[\\/]@fortawesome[\\/]/ }],
        },
      },
    },
  },
  css: {
    postcss: {
      plugins: [
        {
          postcssPlugin: 'normalize-imported-charset',
          // Bootstrap's charset must not remain nested inside a CSS cascade layer.
          OnceExit(root) {
            root.walkAtRules('charset', (rule) => {
              rule.remove();
            });
          },
        },
      ],
    },
  },
});
