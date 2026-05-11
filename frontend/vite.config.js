import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __APP_BUILD__: JSON.stringify(new Date().toISOString().slice(0, 16).replace('T', ' ')),
  },
  build: {
    outDir: 'dist',
    target: 'es2020',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        // Split vendor deps into their own long-cached chunk. Since they
        // change far less often than app code, browsers can keep them in
        // long-term cache across deploys (filename-hashed → immutable per
        // _headers). App-only changes only invalidate `index-*.js`, not
        // vendor.
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/scheduler/')) {
              return 'vendor-react';
            }
            if (id.includes('lucide-react')) return 'vendor-lucide';
            if (id.includes('tailwindcss') || id.includes('@tailwindcss')) return 'vendor-tailwind';
            return 'vendor-misc';
          }
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
    chunkSizeWarningLimit: 250,
  },
});
