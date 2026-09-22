import { Hono } from "hono"
import { fetchGithubStats } from "./github"
import { renderErrorCard, renderStatsCard, type Theme } from "./svg"

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

  // The username is not a request parameter — it's fixed by the server's
  // own env config, so the widget can't be pointed at another account.
  const username = process.env.GITHUB_USERNAME
  if (!username) {
    return svgResponse(renderErrorCard("server is missing GITHUB_USERNAME", theme), 500)
  }

  const token = process.env.GITHUB_TOKEN
  if (!token) {
    return svgResponse(renderErrorCard("server is missing GITHUB_TOKEN", theme), 500)
  }

  try {
    const stats = await fetchGithubStats(username, token)
    return svgResponse(renderStatsCard(stats, theme), 200)
  } catch (err) {
    const message = err instanceof Error ? err.message : "failed to load stats"
    return svgResponse(renderErrorCard(message, theme), 502)
  }
})

export default app
