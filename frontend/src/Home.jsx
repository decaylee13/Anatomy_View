import { Link } from 'react-router-dom';

const models = [
  {
    name: 'Heart Anatomy',
    description: 'Inspect the segmented adult heart and collaborate with the assistant for guided exploration.',
    href: '/heart',
    accent: 'from-rose-500/80 to-rose-600/60'
  },
  {
    name: 'Brain Anatomy',
    description: 'Study the adult brain including the brain stem with the same conversational assistant experience.',
    href: '/brain',
    accent: 'from-indigo-500/80 to-indigo-600/60'
  },
  {
    name: 'Skeleton Anatomy',
    description: 'Examine a full-body human skeleton model with guided exploration from the assistant.',
    href: '/skeleton',
    accent: 'from-amber-500/80 to-amber-600/60'
  }
];

function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-white">
      <header className="border-b border-white/10 bg-slate-950/80">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-12 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-400">Dedalus Labs</p>
            <h1 className="mt-3 text-4xl font-semibold leading-tight sm:text-5xl">Anatomy Learning Hub</h1>
            <p className="mt-4 max-w-2xl text-base text-white/70">
              Choose an interactive 3D model to explore with the Gemini-powered teaching assistant. Each experience includes
              manual camera controls, contextual annotations, and guided chat-based support.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-white/70">
            <p className="font-semibold text-white">Now available</p>
            <ul className="mt-2 space-y-1 text-white/60">
              <li>✔ Heart model with regional highlighting</li>
              <li>✔ Brain model with brain stem detail</li>
              <li>✔ Skeleton model with articulated full-body view</li>
            </ul>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-6 py-12">
        <div className="grid gap-6 sm:grid-cols-2">
          {models.map((model) => (
            <Link
              key={model.name}
              to={model.href}
              className="group relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60 p-8 transition hover:border-white/30 hover:bg-slate-900/80"
            >
              <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${model.accent} opacity-0 transition group-hover:opacity-20`} />
              <div className="relative space-y-4">
                <h2 className="text-2xl font-semibold text-white">{model.name}</h2>
                <p className="text-sm leading-relaxed text-white/70">{model.description}</p>
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-sky-400 transition group-hover:text-sky-300">
                  Enter experience
                  <span aria-hidden="true">→</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </main>

      <footer className="border-t border-white/10 bg-slate-950/80">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-4 px-6 py-6 text-sm text-white/50 sm:flex-row">
          <p>© {new Date().getFullYear()} Dedalus Labs. All rights reserved.</p>
          <p>Crafted with Three.js, React, and Gemini.</p>
        </div>
      </footer>
    </div>
  );
}

export default Home;
