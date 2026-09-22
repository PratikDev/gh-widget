export interface LanguageStat {
  name: string
  color: string
  size: number
  percent: number
}

export interface GithubStats {
  name: string
  login: string
  currentStreak: number
  commitsThisYear: number
  contributionsThisYear: number
  repositoriesContributedTo: number
  topLanguages: LanguageStat[]
  year: number
}

interface ContributionDay {
  date: string
  contributionCount: number
}

interface GraphQLResponse {
  data?: {
    user: {
      name: string | null
      login: string
      yearData: {
        totalCommitContributions: number
        contributionCalendar: {
          totalContributions: number
        }
      }
      streakData: {
        contributionCalendar: {
          weeks: { contributionDays: ContributionDay[] }[]
        }
      }
      repositoriesContributedTo: { totalCount: number }
      repositories: {
        nodes: {
          name: string
          languages: {
            edges: { size: number; node: { name: string; color: string | null } }[]
          } | null
        }[]
      }
    } | null
  }
  errors?: { message: string }[]
}

const QUERY = `
query Stats(
  $login: String!
  $yearFrom: DateTime!
  $yearTo: DateTime!
  $streakFrom: DateTime!
  $streakTo: DateTime!
) {
  user(login: $login) {
    name
    login
    yearData: contributionsCollection(from: $yearFrom, to: $yearTo) {
      totalCommitContributions
      contributionCalendar {
        totalContributions
      }
    }
    streakData: contributionsCollection(from: $streakFrom, to: $streakTo) {
      contributionCalendar {
        weeks {
          contributionDays {
            date
            contributionCount
          }
        }
      }
    }
    repositoriesContributedTo(
      first: 1
      contributionTypes: [COMMIT, ISSUE, PULL_REQUEST, PULL_REQUEST_REVIEW, REPOSITORY]
    ) {
      totalCount
    }
    repositories(
      first: 100
      ownerAffiliations: [OWNER]
      isFork: false
      orderBy: { field: UPDATED_AT, direction: DESC }
    ) {
      nodes {
        name
        languages(first: 10, orderBy: { field: SIZE, direction: DESC }) {
          edges {
            size
            node {
              name
              color
            }
          }
        }
      }
    }
  }
}
`

function computeCurrentStreak(weeks: { contributionDays: ContributionDay[] }[]): number {
  const days = weeks.flatMap((w) => w.contributionDays)
  if (days.length === 0) return 0

  let i = days.length - 1
  // Today (last day) having zero contributions doesn't break a streak that's
  // still active earlier the same day in the user's timezone — just skip it.
  if (days[i].contributionCount === 0) i--

  let streak = 0
  for (; i >= 0; i--) {
    if (days[i].contributionCount > 0) {
      streak++
    } else {
      break
    }
  }
  return streak
}

interface RepositoriesResult {
  nodes: {
    name: string
    languages: {
      edges: { size: number; node: { name: string; color: string | null } }[]
    } | null
  }[]
}

function computeTopLanguages(repositories: RepositoriesResult, limit = 5): LanguageStat[] {
  const totals = new Map<string, { color: string; size: number }>()

  for (const repo of repositories.nodes) {
    if (!repo.languages) continue
    for (const edge of repo.languages.edges) {
      const key = edge.node.name
      const existing = totals.get(key)
      if (existing) {
        existing.size += edge.size
      } else {
        totals.set(key, { color: edge.node.color ?? "#8b949e", size: edge.size })
      }
    }
  }

  const grandTotal = [...totals.values()].reduce((sum, v) => sum + v.size, 0)
  if (grandTotal === 0) return []

  return [...totals.entries()]
    .map(([name, v]) => ({
      name,
      color: v.color,
      size: v.size,
      percent: (v.size / grandTotal) * 100,
    }))
    .sort((a, b) => b.size - a.size)
    .slice(0, limit)
}

export async function fetchGithubStats(login: string, token: string): Promise<GithubStats> {
  const now = new Date()
  const year = now.getUTCFullYear()

  const yearFrom = new Date(Date.UTC(year, 0, 1)).toISOString()
  const yearTo = now.toISOString()

  const streakFrom = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString()
  const streakTo = now.toISOString()

  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "gh-widget",
    },
    body: JSON.stringify({
      query: QUERY,
      variables: { login, yearFrom, yearTo, streakFrom, streakTo },
    }),
  })

  if (!res.ok) {
    throw new Error(`GitHub API responded with ${res.status}`)
  }

  const json = (await res.json()) as GraphQLResponse

  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join("; "))
  }
  if (!json.data?.user) {
    throw new Error("GitHub user not found")
  }

  const user = json.data.user

  return {
    name: user.name ?? user.login,
    login: user.login,
    currentStreak: computeCurrentStreak(user.streakData.contributionCalendar.weeks),
    commitsThisYear: user.yearData.totalCommitContributions,
    contributionsThisYear: user.yearData.contributionCalendar.totalContributions,
    repositoriesContributedTo: user.repositoriesContributedTo.totalCount,
    topLanguages: computeTopLanguages(user.repositories),
    year,
  }
}
