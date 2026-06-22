// Lightweight wrapper around the public, unauthenticated GitHub REST API.
// No token needed — works for any public profile.

const GITHUB_API = 'https://api.github.com'

/**
 * GitHub's REST API has no "pinned repos" endpoint without GraphQL + auth,
 * so we approximate it with the user's top repositories by star count —
 * same idea (showcase their best work), no token required.
 */
export async function fetchTopRepos(username, limit = 6) {
  if (!username) return []
  const res = await fetch(
    `${GITHUB_API}/users/${encodeURIComponent(username)}/repos?per_page=100&type=owner`
  )
  if (!res.ok) return []
  const repos = await res.json()
  if (!Array.isArray(repos)) return []
  return repos
    .filter((r) => !r.fork)
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, limit)
    .map((r) => ({
      name: r.name,
      url: r.html_url,
      description: r.description,
      stars: r.stargazers_count,
      forks: r.forks_count,
      language: r.language,
      updatedAt: r.updated_at,
    }))
}

export async function fetchGithubProfile(username) {
  if (!username) return null
  const res = await fetch(`${GITHUB_API}/users/${encodeURIComponent(username)}`)
  if (!res.ok) return null
  const data = await res.json()
  return {
    avatarUrl: data.avatar_url,
    bio: data.bio,
    publicRepos: data.public_repos,
    followers: data.followers,
    following: data.following,
  }
}

// Public, key-free contribution-graph image (renders the same green-square
// graph as github.com/<user>, generated server-side from public commit data).
export function contributionGraphUrl(username, theme = 'classic') {
  return `https://ghchart.rshah.org/${theme === 'dark' ? '24292e' : '40c463'}/${encodeURIComponent(username)}`
}
