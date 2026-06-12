# AGENTS.md - Dev Environment Guide

## Commands
- Package manager: `npm@10.9.3`
- Development: `npm run dev`
- Production build: `npm run build`
- Start production: `npm run start`
- Lint: `npm run lint`
- Format code: `npm run format`
- Export static site: `npm run export`

## Code Style
- **Components**: PascalCase, one per folder with index.tsx export
- **Variables/Functions**: camelCase
- **Styling**: Tailwind CSS with custom configuration
- **Imports**: Group by external/internal, alphabetize
- **TypeScript**: Used throughout with `strict: false`
- **Error Handling**: Try to handle errors gracefully with user-friendly messages

## Project Structure
- `/components`: UI components organized by feature
- `/pages`: Next.js pages and API routes
- `/lib`: Utility functions and services
- `/schemas`: Sanity CMS schema definitions
- `/styles`: Global styles and TailwindCSS customization

## Stack
- Next.js `^16.2.9` with React `^19.2.7`
- TypeScript `^6.0.3`
- Tailwind CSS `^4.3.0` with `@tailwindcss/postcss`, typography, and touch plugins
- Sanity `^6.0.0` with `next-sanity` `^13.1.0`
- Liveblocks `^3.19.5` for collaboration features
- Mapbox GL, PostHog, Vercel KV/OG, Resend, styled-components, and next-sitemap
