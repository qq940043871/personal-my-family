import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'

export default defineConfig({
  plugins: [uni()],
  server: {
    host: '0.0.0.0',
    port: 5173
  },
  build: {
    // H5 构建产物输出到 unpackage/dist/build/h5
    outDir: 'unpackage/dist/build/h5'
  }
})
