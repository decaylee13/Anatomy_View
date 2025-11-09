import { Link } from 'react-router-dom';
import Reveal from './components/Reveal.jsx';
import SkullPreview from './components/SkullPreview.jsx';

const chapters = [
  {
    name: 'Cardiac Chapter',
    description: 'Chat with Medverse to explore valves, chambers, and coronary flow in guided heart sessions.',
    href: '/heart',
    accent: 'from-rose-400/80 via-rose-300/60 to-rose-400/30',
    image: '/card_pictures/heart-image.jpg',
    slug: 'heart'
  },
  {
    name: 'Neuro Chapter',
    description: 'Chat with Medverse to unpack cortical regions, deep nuclei, and vascular pathways of the brain.',
    href: '/brain',
    accent: 'from-indigo-400/80 via-indigo-300/60 to-indigo-400/30',
    image: '/card_pictures/brain-placeholder.png',
    slug: 'brain'
  },
  {
    name: 'Skeletal Chapter',
    description: 'Chat with Medverse to learn key skeletal regions and landmark relationships across the body.',
    href: '/skeleton',
    accent: 'from-amber-400/80 via-amber-300/60 to-amber-400/30',
    image: '/card_pictures/skeleton-image.jpg',
    slug: 'skeleton'
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
      {chapter.image ? (
        <div className="mb-5 overflow-hidden rounded-xl">
          <img
            src={chapter.image}
            alt={chapter.name}
            className="h-52 w-full object-cover transition duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </div>
      ) : null}
      <div className="flex flex-1 flex-col justify-between gap-6">
        <div className="space-y-2">
          <span className="inline-flex items-center rounded-full bg-sky-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-700 ring-1 ring-sky-100">
            Interactive model
          </span>
          <h3 className="text-xl font-semibold text-slate-900">{chapter.name}</h3>
          <p className="text-sm leading-relaxed text-slate-600">{chapter.description}</p>
        </div>
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-sky-700 transition group-hover:translate-x-1">
          Study the {chapter.slug} <span aria-hidden="true">→</span>
        </span>
      </div>
    </Link>
  );
}

export default function Home() {
  return (
    <div
      className="relative min-h-screen overflow-x-hidden overflow-y-auto text-slate-100"
      style={{
        background:
          'linear-gradient(140deg, rgba(15,23,42,1) 0%, rgba(30,41,59,0.92) 45%, rgba(51,65,85,0.88) 100%)'
      }}
    >

      <header className="pt-28">
        <div className="mx-auto w-full max-w-6xl px-6 pb-16 pt-12 lg:pb-20 lg:pt-16">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,480px)] lg:items-center">
            <Reveal className="space-y-6">
              <p className="inline-flex items-center rounded-full bg-slate-700/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-sky-200 ring-1 ring-sky-400/30">
                AI Medical Textbook
              </p>
              <h1 className="text-4xl font-semibold leading-tight text-slate-50 sm:text-5xl">
                Learn anatomy through clean, interactive 3D models
              </h1>
              <p className="text-base leading-7 text-slate-100/90">
                Built for clarity and mastery. Explore the heart, brain, and skeleton with adaptive guidance and concise
                explanations—no clutter, just the essentials.
              </p>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-200/70">
                Click & drag the skull to explore
              </p>
            </Reveal>
            <Reveal delay={120} className="flex justify-center lg:justify-center">
              <SkullPreview />
            </Reveal>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 py-12 lg:py-16">
        <section id="chapters" aria-labelledby="chapters-heading" className="space-y-6">
          <Reveal className="flex flex-col gap-2" as="div">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-200/90" id="chapters-heading">
              Models
            </p>
            <h2 className="text-2xl font-semibold text-slate-50 sm:text-3xl">Choose an interactive model</h2>
            <p className="max-w-2xl text-sm text-slate-100/80">
              Each model pairs an interactive 3D model with stepwise reasoning, clinical context, and quick recall
              checks—so you can see it, understand it, and remember it.
            </p>
          </Reveal>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {chapters.map((chapter, index) => (
              <Reveal key={chapter.name} delay={index * 120} className="h-full">
                <ChapterCard chapter={chapter} />
              </Reveal>
            ))}
          </div>
        </section>

        <Reveal as="section" className="mt-16 grid gap-6 rounded-2xl border border-white/10 bg-white/18 p-8 backdrop-blur">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-200">How it works</p>
            <h3 className="text-xl font-semibold text-slate-50">A focused, stepwise learning flow</h3>
            <p className="text-sm text-slate-100/80">
              We trimmed the interface to the essentials. Pick a system, manipulate the model, and follow the guided
              prompts. The narration adapts to your questions and turns key points into quick checks.
            </p>
          </div>
          <ul className="grid gap-3 text-sm text-slate-100 sm:grid-cols-3">
            <Reveal as="li" className="rounded-xl bg-sky-500/25 p-4 ring-1 ring-sky-400/30" delay={100}>
              <p className="font-semibold text-slate-50">Adaptive explanations</p>
              <p className="mt-1 text-slate-100/80">Choose overview or exam depth—explanations adjust on demand.</p>
            </Reveal>
            <Reveal as="li" className="rounded-xl bg-indigo-500/25 p-4 ring-1 ring-indigo-400/30" delay={200}>
              <p className="font-semibold text-slate-50">Clinically grounded</p>
              <p className="mt-1 text-slate-100/80">Models and examples align with standard clinical references.</p>
            </Reveal>
            <Reveal as="li" className="rounded-xl bg-amber-400/25 p-4 ring-1 ring-amber-300/30" delay={300}>
              <p className="font-semibold text-slate-50">Built for mastery</p>
              <p className="mt-1 text-slate-100/80">Inline recall checks reinforce the key structures and relations.</p>
            </Reveal>
          </ul>
        </Reveal>
      </main>

      <footer className="border-t border-white/10 bg-slate-800/85">
        <div className="mx-auto w-full max-w-6xl px-6 py-6 text-sm text-slate-200">
          <p>© {new Date().getFullYear()} Interactive AI Medical Textbook.</p>
        </div>
      </footer>
    </div>
  );
}