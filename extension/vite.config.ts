import path from "path"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { viteStaticCopy } from "vite-plugin-static-copy"

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(), 
    viteStaticCopy({
      targets: [
        {
          src: "public/manifest.json",
          dest: "."
        }
      ]
    }),
  ],
  build: {
    outDir: "build",
    rollupOptions: {
      input: {
        main: './index.html',
        background: './src/background/background.ts',
        content: './src/background/content.ts',
      },
      output: {
        entryFileNames: `assets/[name].js`,
        chunkFileNames: `assets/[name].js`,
        assetFileNames: `assets/[name].[ext]`,
      }
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    }
  }
})
