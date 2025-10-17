# AGENTS.md
A guide for AI coding agents contributing to this repository.

## Setup commands
```bash
npm install
npm run dev   # Start Vite dev server with React Fast Refresh
npm run build # Production build output to dist/
npm run lint  # ESLint using eslint.config.js
npm run test  # bun test (requires Bun runtime)
```
- Optional: `npm run preview` serves the production build locally, and `npm run build:dev` creates a development-mode bundle.
- Install and authenticate the Supabase CLI when working with edge functions or migrations.

## Code style
- TypeScript + React 18 with functional components; respect hooks rules enforced by `eslint-plugin-react-hooks`.
- Tailwind CSS is the primary styling approach. Prefer shadcn/ui primitives in `src/components/` before introducing new bespoke UI.
- Follow the ESLint configuration in `eslint.config.js`; avoid disabling rules without justification. No Prettier configuration is present.
- Supabase edge functions (under `supabase/functions/`) target the Deno runtime—use standard web APIs (`fetch`, `Response`) and avoid Node-specific globals.
- Keep shared utilities in `src/lib/` or `src/hooks/`, and place feature-specific code inside the relevant `src/features/<feature>/` folder.

## Testing instructions
- `npm run lint` — Run ESLint for static analysis.
- `npm run test` — Executes Bun-powered tests in the `tests/` directory; ensure Bun is installed locally.
- `npx tsc --noEmit` — Manual type-check if you need a stricter gate before committing.
- Launch `npm run dev` to manually verify UI changes; integrate Supabase-backed flows using `.env.local` secrets.

## Agent guidance
- Check for additional `AGENTS.md` files when adding new directories; none exist currently, so add scoped guidance if needed.
- Create a `.env.local` for local runs. Common keys: `VITE_OPENAI_API_KEY`, `SUPABASE_URL`, and `SUPABASE_SERVICE_ROLE_KEY`.
- Reuse shared utilities (e.g., `src/lib/axios.ts`, Supabase helpers) instead of duplicating API logic.
- Coordinate frontend updates with Supabase functions by keeping `src/Api/` clients and edge functions in sync.
- Large static datasets live in `components.json` and `src/data/`; avoid unnecessary regeneration.

## PR instructions
1. Branch off the default branch.
2. Keep commits focused and descriptive.
3. Before opening a PR, run `npm run lint`, `npm run test`, and optionally `npx tsc --noEmit`.
4. Manually verify user-facing flows via `npm run dev` when relevant and document the checks in the PR description.
5. Update docs or configs when introducing new environment variables, scripts, or Supabase assets.

## Folder structure
- `src/main.tsx` bootstraps the React app and global providers; `src/App.tsx` defines the shell layout and routing.
- `src/features/` — Domain-specific modules organized by feature, often containing nested `components/`, `hooks/`, and `services/` folders.
- `src/components/` — Shared shadcn/ui primitives and design system pieces.
- `src/hooks/`, `src/lib/`, `src/integrations/`, and `src/data/` — Reusable logic, API helpers, integrations, and static datasets.
- `src/Api/` — REST-style helpers that call Supabase edge functions and external APIs.
- `supabase/functions/` — Edge functions for the Supabase Deno runtime; `supabase/migrations/` stores SQL migrations.

## CI/CD notes
- No GitHub Actions or other CI workflows are configured in `.github/workflows/`.
- Supabase deployments rely on the Supabase CLI; run `supabase functions deploy` or `supabase db push` as needed outside this repo.
