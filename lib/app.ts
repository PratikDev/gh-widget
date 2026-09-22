import { Hono } from "hono"
import { fetchGithubStats } from "./github"
import { renderErrorCard, renderStatsCard, type Theme } from "./svg"

// This widget only ever serves the repo owner's own stats — the username
// is not a request parameter, so it can't be pointed at any other account.
const ALLOWED_USER = "pratikdev"

const app = new Hono()

function svgResponse(body: string, status: number) {
  return new Response(body, {
    status,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=1800, s-maxage=1800, stale-while-revalidate=3600",
    },
  })
}

app.get("*", async (c) => {
  const themeParam = c.req.query("theme")
  const theme: Theme = themeParam === "light" ? "light" : "dark"

  const token = process.env.GITHUB_TOKEN
  if (!token) {
    return svgResponse(renderErrorCard("server is missing GITHUB_TOKEN", theme), 500)
  }

  try {
    const stats = await fetchGithubStats(ALLOWED_USER, token)
    return svgResponse(renderStatsCard(stats, theme), 200)
  } catch (err) {
    const message = err instanceof Error ? err.message : "failed to load stats"
    return svgResponse(renderErrorCard(message, theme), 502)
  }
})

export default app
