import { defineConfig, loadEnv } from 'vite';
import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {

        const root = path.resolve(__dirname, '../..');

        process.env = {
                ...process.env,
                ...loadEnv(mode, root)
        };

        if (!process.env.VITE_API_URL) {
                throw new Error('VITE_API_URL is not defined in .env file');
        }

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
                                        target: process.env.VITE_API_URL,
                                        changeOrigin: true,
                                },
                        },
                },
        };

});