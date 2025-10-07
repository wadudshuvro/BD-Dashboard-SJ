# AGENTS.md
A guide for AI coding agents contributing to this repository.

## Setup commands
```bash
npm install
npm run dev
npm run build
npm run lint
# (no automated test suite is defined; see Testing & QA)
```

## Repository overview
- **Framework**: Vite + React 18 + TypeScript with Tailwind CSS and shadcn/ui for component primitives.
- **Frontend entry points**:
  - `src/main.tsx` bootstraps React with React Router, global providers, and Tailwind styles from `src/index.css`.
  - `src/App.tsx` defines the top-level layout and routing shell.
- **Feature structure**:
  - `src/features/` holds domain-specific modules (dashboards, agents, marketing tools, etc.) often broken into sub-folders with components, hooks, and services.
  - `src/components/` contains shared UI elements generated from shadcn templates.
  - `src/hooks/`, `src/lib/`, `src/integrations/`, and `src/data/` provide reusable logic, API helpers, and static datasets.
  - `src/Api/` exposes REST-style helpers for Supabase edge functions and external services.
- **Styling**: Tailwind CSS configured via `tailwind.config.ts`, with additional typography plugin and custom themes.
- **Supabase backend**:
  - Edge functions live in `supabase/functions/` and are authored for Deno runtime (ESM imports, `serve` from `std@0.168.0`).
  - SQL migrations are stored under `supabase/migrations/`; apply them with Supabase CLI during local development.

## Key workflows & tooling
- **Development server**: `npm run dev` launches Vite on the default port (usually `5173`). Hot module replacement is enabled.
- **Building**: `npm run build` produces production assets in `dist/`. Use `npm run preview` (manually) to inspect the build locally.
- **Linting**: `npm run lint` runs ESLint with the configuration in `eslint.config.js`. Fix lint violations before committing.
- **Type checking**: TypeScript is configured via `tsconfig.json` and related `tsconfig.*` files. Run `npx tsc --noEmit` if you need an explicit type check.
- **Supabase functions**: Use `supabase functions serve <name> --env-file .env.local` to iterate on individual functions. Ensure you have the Supabase CLI installed and logged in.

## Environment variables & secrets
Create a `.env.local` for Vite and Supabase tooling. Key values encountered in the codebase:
- `VITE_OPENAI_API_KEY`: Required by `src/lib/axios.ts` for authenticated OpenAI API calls. Without it, requests warn and skip authorization headers.
- Supabase CLI commands additionally expect `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (see edge functions). Provide them when running or deploying Supabase functions.
Keep secrets out of version control; `.env*` files are typically git-ignored.

## Testing & QA
- No automated unit/integration test scripts are defined. Prioritize manual verification via the Vite dev server.
- Run `npm run lint` and optionally `npx tsc --noEmit` before opening a PR to catch issues.
- If you add tests (e.g., Vitest or Jest), document the new command(s) here and update `package.json` scripts accordingly.

## Code style & conventions
- Follow the ESLint rules defined in `eslint.config.js`. Avoid disabling lint rules unless absolutely necessary and justify in comments.
- Stick to TypeScript with ES modules. Do not wrap imports in `try/catch` blocks.
- Prefer Tailwind utility classes and existing shadcn components for styling instead of bespoke CSS when feasible.
- Keep React components functional and hooks-compliant; respect hooks rules enforced by `eslint-plugin-react-hooks`.
- Co-locate feature-specific assets under the relevant folder (e.g., `src/features/<feature>/components`). Shared logic should live in `src/lib/` or `src/hooks/`.

## Supabase-specific guidance
- Edge functions are written for Deno. Avoid Node-specific APIs (e.g., `require`, `process`). Use `fetch`, `Response`, and other web-standard interfaces.
- Reuse the shared CORS helper from `supabase/functions/_shared/cors.ts` when exposing new HTTP functions to keep headers consistent.
- When modifying migrations, ensure timestamps remain unique and sequential. Use the Supabase CLI (`supabase migration new <name>`) to generate new migration files.

## Contribution workflow
1. Create a feature branch off the default branch.
2. Make focused changes following the conventions above.
3. Verify the app locally (`npm run dev`), lint (`npm run lint`), and type-check if needed (`npx tsc --noEmit`).
4. Update documentation or configuration when adding new capabilities (e.g., environment variables, scripts, or Supabase functions).
5. Commit with descriptive messages and open a PR summarizing key changes and testing evidence.

## Additional tips for AI agents
- Before editing, scan for any nested `AGENTS.md` files if you add new directories; create additional scoped instructions as needed.
- Large static data and generated UI live under `components.json` and `src/data/`; avoid re-generating unless necessary.
- When integrating with external APIs (OpenAI, GoHighLevel, etc.), mimic existing axios/fetch helpers to keep behavior consistent.
- Coordinate frontend changes with Supabase updates: update both the edge function code and TypeScript clients that consume them.
