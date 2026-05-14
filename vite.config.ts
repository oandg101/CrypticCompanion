import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * vite.config.ts
 *
 * BASE PATH FOR GITHUB PAGES:
 *   GitHub Pages serves your app from https://username.github.io/repo-name/
 *   Vite needs to know this sub-path so asset URLs are correct.
 *
 *   The GitHub Actions workflow (.github/workflows/deploy.yml) sets
 *   VITE_BASE_URL automatically from the repository name:
 *     VITE_BASE_URL: /<repo-name>/
 *
 *   For local development, VITE_BASE_URL is unset, so base defaults to '/'.
 *   No manual configuration needed — the workflow handles it.
 *
 *   If deploying manually (not via GitHub Actions), set:
 *     VITE_BASE_URL=/your-repo-name/ npm run build
 */
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_URL ?? '/',
})
