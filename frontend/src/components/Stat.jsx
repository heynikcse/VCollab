export default function Stat({ n, l }) {
  return (
    <div className="glass rounded-xl py-3">
      <div className="font-display font-bold text-xl text-gradient">{n}</div>
      <div className="text-[10px] uppercase tracking-widest text-ink-faint mt-0.5">{l}</div>
    </div>
  )
}
