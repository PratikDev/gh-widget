import { handle } from "hono/vercel"
import app from "../lib/app"

export const config = { runtime: "edge" }

export default handle(app)
