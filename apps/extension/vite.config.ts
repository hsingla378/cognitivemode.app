import { copyFileSync } from 'node:fs'
import { resolve } from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const sharedPlugins = [react(), tailwindcss()]

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isContentBuild = mode === 'content'
  const isBackgroundBuild = mode === 'background'
  const isPopupBuild = mode === 'popup'

  const rollupInput = isContentBuild
    ? resolve(__dirname, 'src/content/index.tsx')
    : isBackgroundBuild
      ? resolve(__dirname, 'src/background.ts')
      : {
          popup: resolve(__dirname, 'popup.html'),
          history: resolve(__dirname, 'history.html'),
        }

  return {
    base: './',
    plugins: [
      ...sharedPlugins,
      {
        name: 'copy-manifest',
        closeBundle() {
          if (isPopupBuild || isBackgroundBuild) {
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
        input: rollupInput,
        output: {
          entryFileNames: () => {
            if (isContentBuild) return 'content.js'
            if (isBackgroundBuild) return 'background.js'
            return 'assets/[name].js'
          },
          chunkFileNames: 'chunks/[name].js',
          format: isBackgroundBuild ? 'iife' : undefined,
          assetFileNames: (assetInfo) => {
            if (assetInfo.names?.some((name) => name.endsWith('.css'))) {
              return isContentBuild ? 'content.css' : 'assets/[name][extname]'
            }
            return 'assets/[name][extname]'
          },
        },
      },
    },
  }
})
