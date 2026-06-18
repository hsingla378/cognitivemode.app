import { copyFileSync } from 'node:fs'
import { resolve } from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const sharedPlugins = [react(), tailwindcss()]

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isContentBuild = mode === 'content'

  return {
    base: './',
    plugins: [
      ...sharedPlugins,
      {
        name: 'copy-manifest',
        closeBundle() {
          if (!isContentBuild) {
            copyFileSync(
              resolve(__dirname, 'manifest.json'),
              resolve(__dirname, 'dist/manifest.json'),
            )
          }
        },
      },
    ],
    build: {
      outDir: 'dist',
      emptyOutDir: isContentBuild,
      cssCodeSplit: false,
      rollupOptions: {
        input: isContentBuild
          ? resolve(__dirname, 'src/content/index.tsx')
          : resolve(__dirname, 'popup.html'),
        output: {
          entryFileNames: isContentBuild ? 'content.js' : 'assets/[name].js',
          chunkFileNames: 'chunks/[name].js',
          assetFileNames: (assetInfo) => {
            if (assetInfo.names?.some((name) => name.endsWith('.css'))) {
              return isContentBuild ? 'content.css' : 'assets/popup[extname]'
            }
            return 'assets/[name][extname]'
          },
        },
      },
    },
  }
})
