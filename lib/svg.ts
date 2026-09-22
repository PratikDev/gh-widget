import type { GithubStats } from "./github"

export type Theme = "dark" | "light"

const THEMES: Record<Theme, {
  bg: string
  border: string
  text: string
  muted: string
  track: string
}> = {
  dark: {
    bg: "#0d1117",
    border: "#30363d",
    text: "#e6edf3",
    muted: "#8b949e",
    track: "#30363d",
  },
  light: {
    bg: "#ffffff",
    border: "#d0d7de",
    text: "#1f2328",
    muted: "#59636e",
    track: "#eaeef2",
  },
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif"

export function renderStatsCard(stats: GithubStats, theme: Theme): string {
  const c = THEMES[theme]
  const width = 540
  const height = 210

  const statBlocks = [
    { value: stats.currentStreak.toLocaleString(), label: "Current Streak" },
    { value: stats.commitsThisYear.toLocaleString(), label: `Commits (${stats.year})` },
    { value: stats.contributionsThisYear.toLocaleString(), label: `Contributions (${stats.year})` },
    { value: stats.repositoriesContributedTo.toLocaleString(), label: "Repos Contributed To" },
  ]

  const statsGrid = statBlocks
    .map((block, i) => {
      const col = i % 2
      const row = Math.floor(i / 2)
      const x = 32 + col * 130
      const y = 108 + row * 62
      return `
        <text x="${x}" y="${y}" fill="${c.text}" font-family="${FONT}" font-size="26" font-weight="700">${escapeXml(block.value)}</text>
        <text x="${x}" y="${y + 20}" fill="${c.muted}" font-family="${FONT}" font-size="13">${escapeXml(block.label)}</text>
      `
    })
    .join("")

  const langX = 300
  const barWidth = 190
  const langRows = stats.topLanguages
    .map((lang, i) => {
      const y = 64 + i * 27
      const filled = Math.max((lang.percent / 100) * barWidth, 3)
      const delay = (0.4 + i * 0.15).toFixed(2)
      return `
        <text x="${langX}" y="${y}" fill="${c.text}" font-family="${FONT}" font-size="13">${escapeXml(lang.name)}</text>
        <text x="${langX + barWidth}" y="${y}" fill="${c.muted}" font-family="${FONT}" font-size="12" text-anchor="end">${lang.percent.toFixed(1)}%</text>
        <rect x="${langX}" y="${y + 7}" width="${barWidth}" height="5" rx="2.5" fill="${c.track}" />
        <rect class="bar-fill" x="${langX}" y="${y + 7}" width="${filled.toFixed(1)}" height="5" rx="2.5" fill="${lang.color}" style="animation-delay:${delay}s" />
      `
    })
    .join("")

  return `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="GitHub stats for ${escapeXml(stats.login)}">
  <style>
    .card { animation: fadeIn 0.6s ease-out both; }
    .bar-fill { transform-box: fill-box; transform-origin: left; animation: growBar 0.8s ease-out both; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes growBar { from { transform: scaleX(0); } to { transform: scaleX(1); } }
    @media (prefers-reduced-motion: reduce) {
      .card, .bar-fill { animation: none; }
    }
  </style>
  <g class="card">
    <rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="12" fill="${c.bg}" stroke="${c.border}" />

    <text x="32" y="42" fill="${c.text}" font-family="${FONT}" font-size="20" font-weight="700">${escapeXml(stats.name)}</text>
    <text x="32" y="64" fill="${c.muted}" font-family="${FONT}" font-size="14">@${escapeXml(stats.login)}</text>

    ${statsGrid}

    <text x="${langX}" y="34" fill="${c.muted}" font-family="${FONT}" font-size="12" font-weight="600" letter-spacing="1">TOP LANGUAGES</text>
    ${langRows}
  </g>
</svg>
`.trim()
}

export function renderErrorCard(message: string, theme: Theme = "dark"): string {
  const c = THEMES[theme]
  const width = 540
  const height = 100
  return `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="gh-widget error">
  <rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="12" fill="${c.bg}" stroke="${c.border}" />
  <text x="32" y="45" fill="${c.text}" font-family="${FONT}" font-size="15" font-weight="700">gh-widget error</text>
  <text x="32" y="68" fill="${c.muted}" font-family="${FONT}" font-size="13">${escapeXml(message)}</text>
</svg>
`.trim()
}
