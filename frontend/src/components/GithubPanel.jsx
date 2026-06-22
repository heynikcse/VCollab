import { useEffect, useState } from 'react'
import { fetchTopRepos, contributionGraphUrl } from '../lib/github'
import { Card, Spinner } from './ui/Primitives'

export default function GithubPanel({ username }) {
  const [repos, setRepos] = useState(null)
  const [graphError, setGraphError] = useState(false)

  useEffect(() => {
    let cancelled = false
    setRepos(null)
    setGraphError(false)
    if (!username) return
    fetchTopRepos(username, 6).then((data) => {
      if (!cancelled) setRepos(data)
    })
    return () => { cancelled = true }
  }, [username])

  if (!username) return null

  return (
    <div className="space-y-4 mt-4">
      <Card className="p-4">
        <h3 className="text-xs font-mono text-ink-faint tracking-wide uppercase mb-3">
          Contribution graph
        </h3>
        {!graphError ? (
          <img
            src={contributionGraphUrl(username)}
            alt={`${username}'s GitHub contribution graph`}
            className="w-full rounded border border-line"
            onError={() => setGraphError(true)}
          />
        ) : (
          <p className="text-sm text-ink-faint">Couldn't load the contribution graph right now.</p>
        )}
      </Card>

      <Card className="p-4">
        <h3 className="text-xs font-mono text-ink-faint tracking-wide uppercase mb-3">
          Top repositories
        </h3>
        {repos === null ? (
          <div className="py-6 flex justify-center"><Spinner size={20} /></div>
        ) : repos.length === 0 ? (
          <p className="text-sm text-ink-faint">No public repositories found for this username.</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {repos.map((r) => (
              <a
                key={r.name}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 rounded-md border border-line hover:border-ink transition-colors"
              >
                <p className="text-sm font-medium text-ink truncate">{r.name}</p>
                {r.description && (
                  <p className="text-xs text-ink-faint mt-1 line-clamp-2 leading-snug">{r.description}</p>
                )}
                <div className="flex items-center gap-3 mt-2 text-xs text-ink-faint font-mono">
                  {r.language && <span>{r.language}</span>}
                  <span className="flex items-center gap-1">★ {r.stars}</span>
                  <span className="flex items-center gap-1">⑂ {r.forks}</span>
                </div>
              </a>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
