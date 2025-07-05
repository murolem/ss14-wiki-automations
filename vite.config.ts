/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
    plugins: [
        tsconfigPaths()
    ],
    build: {
        target: 'esnext'
    },
    test: {
        // scoped to test with root because it reads the whole fucking project 
        // anyway even when scoped with "include".
        root: "test"
    }
});