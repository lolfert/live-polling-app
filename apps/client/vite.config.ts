import { defineConfig, loadEnv } from 'vite';
import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { URL } from 'url';

export default defineConfig(({ mode }) => {

        const root = path.resolve(__dirname, '../..');

        process.env = {
                ...process.env,
                ...loadEnv(mode, root)
        };

        if (!process.env.VITE_BACKEND_URL) {
                throw new Error('VITE_BACKEND_URL is not defined in .env file');
        }

        const backendUrl = new URL(process.env.VITE_BACKEND_URL);
        const apiUrl = new URL('/api', backendUrl).toString();

        return {
                plugins: [
                        react(),
                        tailwindcss(),
                ],
                resolve: {
                        alias: {
                                '@': path.resolve(__dirname, './src'),
                        },
                },
                server: {
                        port: 3000,
                        proxy: {
                                '/api': {
                                        target: apiUrl,
                                        changeOrigin: true,
                                        rewrite: (path) => path.replace(/^\/api/, ''),
                                },
                                '/socket.io': {
                                        target: process.env.VITE_BACKEND_URL,
                                        ws: true,
                                        changeOrigin: true,
                                }
                        },
                },
        };

});