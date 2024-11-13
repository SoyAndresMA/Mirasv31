// Ruta del fichero: /frontend/vite.config.ts

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
 plugins: [react()],
 resolve: {
   alias: {
     '@': path.resolve(__dirname, './src'),
     '@components': path.resolve(__dirname, './src/components'),
     '@core': path.resolve(__dirname, './src/core'),
     '@hooks': path.resolve(__dirname, './src/hooks'),
     '@utils': path.resolve(__dirname, './src/utils')
   }
 },
 server: {
   port: 3000,
   host: true,
   proxy: {
     '/ws': {
       target: 'ws://localhost:8080',
       ws: true
     }
   }
 }
});