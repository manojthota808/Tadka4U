# Tadka4U

Cinematic short dramas and mini-series streaming web experience.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Architecture

Tadka4U uses a clean 3-tier layered architecture for clear boundaries and easy maintenance:

- **Frontend (`src/frontend`)**: UI presentation components, React contexts (`AccountContext`, `ShelfContext`), custom hooks, and layout shells.
- **Backend (`src/backend`)**: Server runtimes, SSR handlers, privileged PostgreSQL database operations (`supabaseAdmin`), and security middlewares.
- **API (`src/api`)**: Centralized data services (`authApi`, `catalogApi`, `watchlistApi`), client SDKs, and TypeScript contracts.

For full architectural diagrams, conventions, and examples, see [ARCHITECTURE.md](ARCHITECTURE.md).

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS
