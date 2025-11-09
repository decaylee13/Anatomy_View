import { Link } from 'react-router-dom';

const chapters = [
  {
    name: 'Cardiac Chapter',
    description: 'Examine chamber flow, valve mechanics, and coronary pathways with adaptive narration.',
    href: '/heart',
    accent: 'from-rose-400/80 via-rose-300/60 to-rose-400/30'
  },
  {
    name: 'Neuro Chapter',
    description: 'Survey cortical territories, deep nuclei, and vascular networks with guided comparisons.',
    href: '/brain',
    accent: 'from-indigo-400/80 via-indigo-300/60 to-indigo-400/30'
  },
  {
    name: 'Skeletal Chapter',
    description: 'Explore axial and appendicular anatomy and connect landmarks to clinical cases.',
    href: '/skeleton',
    accent: 'from-amber-400/80 via-amber-300/60 to-amber-400/30'
  }
];

function ChapterCard({ chapter }) {
  return (
    <Link
      to={chapter.href}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
    >
      <div
        className={`pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br ${chapter.accent} opacity-0 transition group-hover:opacity-30`}
      />
      <div className="flex flex-1 flex-col justify-between gap-6">
        <div className="space-y-2">
          <span className="inline-flex items-center rounded-full bg-sky-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-700 ring-1 ring-sky-100">
            Interactive model
          </span>
          <h3 className="text-xl font-semibold text-slate-900">{chapter.name}</h3>
          <p className="text-sm leading-relaxed text-slate-600">{chapter.description}</p>
        </div>
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-sky-700 transition group-hover:translate-x-1">
          Open chapter <span aria-hidden="true">→</span>
        </span>
      </div>
    </Link>
  );
}

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-x-hidden overflow-y-auto bg-sky-50 text-slate-800">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(80rem_40rem_at_-10%_-10%,rgba(14,165,233,0.12),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60rem_30rem_at_110%_0%,rgba(99,102,241,0.1),transparent_60%)]" />

      <header className="border-b border-slate-200/70 bg-sky-50/70 backdrop-blur">
        <div className="mx-auto w-full max-w-6xl px-6 py-16 lg:py-20">
          <div className="max-w-3xl space-y-6">
            <p className="inline-flex items-center rounded-full bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-sky-700 ring-1 ring-sky-200">
              AI Medical Textbook
            </p>
            <h1 className="text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl">
              Learn anatomy through clean, interactive 3D models
            </h1>
            <p className="text-base leading-7 text-slate-700">
              Built for clarity and mastery. Explore the heart, brain, and skeleton with adaptive guidance and concise
              explanations—no clutter, just the essentials.
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 py-12 lg:py-16">
        <section aria-labelledby="chapters-heading" className="space-y-6">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500" id="chapters-heading">
              Chapters
            </p>
            <h2 className="text-2xl font-semibold text-slate-900 sm:text-3xl">Choose an interactive chapter</h2>
            <p className="max-w-2xl text-sm text-slate-600">
              Each chapter pairs an interactive 3D model with stepwise reasoning, clinical context, and quick recall
              checks—so you can see it, understand it, and remember it.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {chapters.map((chapter) => (
              <ChapterCard key={chapter.name} chapter={chapter} />
            ))}
          </div>
        </section>

        <section className="mt-16 grid gap-6 rounded-2xl border border-slate-200 bg-white p-8">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">How it works</p>
            <h3 className="text-xl font-semibold text-slate-900">A focused, stepwise learning flow</h3>
            <p className="text-sm text-slate-600">
              We trimmed the interface to the essentials. Pick a system, manipulate the model, and follow the guided
              prompts. The narration adapts to your questions and turns key points into quick checks.
            </p>
          </div>
          <ul className="grid gap-3 text-sm text-slate-700 sm:grid-cols-3">
            <li className="rounded-xl bg-sky-50 p-4 ring-1 ring-sky-100">
              <p className="font-semibold text-slate-900">Adaptive explanations</p>
              <p className="mt-1 text-slate-600">Choose overview or exam depth—explanations adjust on demand.</p>
            </li>
            <li className="rounded-xl bg-indigo-50 p-4 ring-1 ring-indigo-100">
              <p className="font-semibold text-slate-900">Clinically grounded</p>
              <p className="mt-1 text-slate-600">Models and examples align with standard clinical references.</p>
            </li>
            <li className="rounded-xl bg-amber-50 p-4 ring-1 ring-amber-100">
              <p className="font-semibold text-slate-900">Built for mastery</p>
              <p className="mt-1 text-slate-600">Inline recall checks reinforce the key structures and relations.</p>
            </li>
          </ul>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white/70">
        <div className="mx-auto w-full max-w-6xl px-6 py-6 text-sm text-slate-600">
          <p>© {new Date().getFullYear()} Interactive Clinical Textbook.</p>
        </div>
      </footer>
    </div>
  );
}