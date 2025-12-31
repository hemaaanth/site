# CLAUDE.md - Dev Environment Guide

## Commands
- Development: `npm run dev`
- Production build: `npm run build`
- Start production: `npm run start`
- Lint: `npm run lint`
- Format code: `npm run format`
- Export static site: `npm run export`

## Code Style
- **Components**: PascalCase, one per folder with index.tsx export
- **Variables/Functions**: camelCase
- **Styling**: TailwindCSS with custom configuration
- **Imports**: Group by external/internal, alphabetize
- **TypeScript**: Used throughout with loose `strict: false` setting
- **Error Handling**: Try to handle errors gracefully with user-friendly messages

## Project Structure
- `/components`: UI components organized by feature
- `/pages`: Next.js pages and API routes
- `/lib`: Utility functions and services
- `/schemas`: Sanity CMS schema definitions
- `/styles`: Global styles and TailwindCSS customization

## Stack
- Next.js (v15) with React 18
- TypeScript
- TailwindCSS for styling
- Sanity for content management
- Liveblocks for collaboration features