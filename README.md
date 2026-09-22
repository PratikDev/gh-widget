# gh-widget

A self-hosted GitHub stats card, served as SVG from a single Hono API route
deployed as a Vercel Edge Function. The GitHub username is fixed by the
`GITHUB_USERNAME` env var — it is not a request parameter, so the widget
can't be pointed at another account by anyone calling the endpoint.

## Usage

```md
![Stats](https://<your-deployment>.vercel.app/api/widget?theme=dark)
```

`theme` accepts `dark` (default) or `light`.

## Setup

1. Create a GitHub personal access token with `read:user` and `repo` (read)
   scopes.
2. In the Vercel project settings, add environment variables:
   - `GITHUB_USERNAME` = the GitHub account to serve stats for
   - `GITHUB_TOKEN` = the token from step 1
3. Deploy:

```bash
bun install
npx vercel deploy --prod
```

## Local development

Runs with [Bun](https://bun.sh) — no Vercel login needed. Bun automatically
loads `.env.local`.

```bash
bun install
cp .env.example .env.local
# fill in GITHUB_USERNAME and GITHUB_TOKEN in .env.local
bun run dev
```

Then open `http://localhost:3000/api/widget`.

To instead emulate the Vercel edge runtime exactly, use `npm run vercel-dev`
(requires `npx vercel` login/project link).

## What it shows

- Current streak (consecutive days with contributions)
- Commits this year
- Contributions this year
- Repos contributed to
- Top 5 languages by bytes across your owned, non-fork repositories
