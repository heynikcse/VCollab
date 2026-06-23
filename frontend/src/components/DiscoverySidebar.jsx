// Lightweight inline icons (avoid adding new dependency)
function TrendingUpIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <path d="M3 17l6-6 4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 7h6v6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function CalendarIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function HashIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <path d="M7 3v18M17 3v18M3 7h18M3 17h18" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const tags = [
  { tag: "HackVITB25", posts: "1.2k" },
  { tag: "PlacementSeason", posts: "856" },
  { tag: "AIProjects", posts: "612" },
  { tag: "CodeChef", posts: "489" },
  { tag: "HostelLife", posts: "342" },
];

const events = [
  { title: "HackVITB 2025", date: "Mar 14", tag: "Hackathon" },
  { title: "GenAI Workshop", date: "Mar 18", tag: "Workshop" },
  { title: "Startup Pitch Night", date: "Mar 22", tag: "Pitch" },
];

export default function DiscoverySidebar() {
  return (
    <div className="space-y-6 border-l border-line pl-6">
      <section className="glass rounded-2xl p-5">
        <header className="flex items-center gap-2 mb-4">
          <TrendingUpIcon className="size-4 text-neon-cyan" />
          <h3 className="font-display font-semibold text-sm uppercase tracking-wider">Trending</h3>
        </header>
        <ul className="space-y-3">
          {tags.map((t, i) => (
            <li key={t.tag} className="flex items-center justify-between group cursor-pointer">
              <div className="flex items-center gap-3">
                <span className="text-xs text-ink-faint tabular-nums w-4">{i + 1}</span>
                <div>
                  <div className="text-sm font-medium flex items-center gap-1 group-hover:text-neon-cyan transition">
                    <HashIcon className="size-3" />
                    {t.tag}
                  </div>
                  <div className="text-xs text-ink-faint">{t.posts} posts</div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="glass rounded-2xl p-5">
        <header className="flex items-center gap-2 mb-4">
          <CalendarIcon className="size-4 text-neon-purple" />
          <h3 className="font-display font-semibold text-sm uppercase tracking-wider">Upcoming Events</h3>
        </header>
        <ul className="space-y-3">
          {events.map((e) => (
            <li key={e.title} className="glass rounded-xl p-3 hover:ring-neon transition cursor-pointer">
              <div className="flex items-start gap-3">
                <div className="size-11 rounded-lg gradient-neon grid place-items-center text-background font-display font-bold text-xs leading-tight text-center">
                  {e.date.split(" ")[1]}
                  <br />
                  <span className="text-[9px]">{e.date.split(" ")[0]}</span>
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">{e.title}</div>
                  <div className="text-xs text-ink-faint">{e.tag}</div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <div className="glass-strong rounded-2xl p-5 relative overflow-hidden">
        <div className="absolute inset-0 gradient-neon opacity-10" />
        <div className="relative">
          <div className="text-xs uppercase tracking-widest text-neon-cyan font-semibold">Verified Network</div>
          <p className="mt-2 text-sm text-ink-faint">
            Every member is a confirmed VIT Bhopal student. Connect with confidence.
          </p>
        </div>
      </div>
    </div>
  );
}
