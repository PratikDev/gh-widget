import app from "./lib/app"

const port = Number(process.env.PORT ?? 3000)

console.log(`gh-widget dev server: http://localhost:${port}/api/widget`)

export default {
  port,
  fetch: app.fetch,
}
