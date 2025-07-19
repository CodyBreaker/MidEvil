import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'
import tailwindcss from "@tailwindcss/vite"


function moveHtmlPlugin(filename: string) {
  return {
    name: 'move-html',
    closeBundle() {
      const buildPath = outDir
      const oldHtml = path.join(buildPath, filename+'.html')
      const targetDir = path.join(buildPath, filename)
      const targetHtml = path.join(targetDir, 'index.html')

      if (fs.existsSync(oldHtml)) {
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true })
        }
        fs.renameSync(oldHtml, targetHtml)
        console.log('✅ Moved ' + filename +'.html → ' + filename +'/index.html')
      } else {
        console.warn('⚠️ ' + filename +'.html not found, skipping move.')
      }
    }
  }
}

const outDir = process.env.BUILD_TARGET === 'nas'
  ? 'build/nas'
  : 'build/midevil'

export default defineConfig({
  plugins: [
    react(),
    moveHtmlPlugin("host"),
    tailwindcss()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  base: '/midevil/',
  build: {
    outDir,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        host: path.resolve(__dirname, 'host.html')
      },
      output: {
        entryFileNames: chunk => {
          if (chunk.name === 'host') {
            return 'host/assets/[name].[hash].js'
          }
          return 'assets/[name].[hash].js'
        },
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]'
      }
    }
  }
})