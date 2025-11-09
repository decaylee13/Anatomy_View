import { Link } from 'react-router-dom';

const experiences = [
  {
    name: 'Heart Lab',
    description:
      'Rotate a high-resolution, segmented adult heart. Highlight individual chambers, valves, and arterial structures while the assistant explains their function.',
    href: '/heart',
    accent: 'from-rose-500/90 via-rose-500/60 to-rose-600/40'
  },
  {
    name: 'Brain Lab',
    description:
      'Investigate cortical lobes, cerebellum, and deep brain structures. Request annotations on-demand and receive narrated walk-throughs from the assistant.',
    href: '/brain',
    accent: 'from-indigo-500/90 via-indigo-500/60 to-indigo-600/40'
  },
  {
    name: 'Skeleton Lab',
    description:
      'Inspect the articulated skeleton with full-body orbit controls. Quickly identify bones, landmarks, and joints with conversational guidance.',
    href: '/skeleton',
    accent: 'from-amber-500/90 via-amber-500/60 to-amber-600/40'
  }
];

const highlights = [
  {
    title: 'Guided by Gemini',
    detail: 'Ask questions, request comparisons, or generate study prompts directly beside the model.',
    icon: '✨'
  },
  {
    title: 'Clinical fidelity',
    detail: 'Accurate, production-ready medical assets curated by the Dedalus Labs content team.',
    icon: '🫀'
  },
  {
    title: 'Collaborative ready',
    detail: 'Screen-share friendly layout with synchronized camera presets for instructors and learners.',
    icon: '🤝'
  }
];

const quickLinks = [
  {
    title: 'Interaction primer',
    description: 'Learn the orbit, pan, and zoom gestures supported by mouse, touchpad, or touch.',
    href: '/docs/controls'
  },
  {
    title: 'Assistant capabilities',
    description: 'See how Gemini enhances each model with labeling, quiz support, and clinical cases.',
    href: '/docs/assistant'
  }
];

function ExperienceCard({ experience }) {
  return (
    <Link
      to={experience.href}
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-900/60 p-8 transition duration-300 hover:border-white/30 hover:bg-slate-900/80"
    >
      <div className={`pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br ${experience.accent} opacity-0 transition duration-300 group-hover:opacity-25`} />
      <div className="relative flex flex-1 flex-col justify-between gap-8">
        <div className="space-y-3">
          <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
            Dedalus model
          </span>
          <h3 className="text-2xl font-semibold text-white drop-shadow-[0_8px_25px_rgba(15,23,42,0.4)]">
            {experience.name}
          </h3>
          <p className="text-sm leading-relaxed text-white/70">{experience.description}</p>
        </div>
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-sky-400 transition group-hover:translate-x-1 group-hover:text-sky-200">
          Enter lab
          <span aria-hidden="true">→</span>
        </span>
      </div>
    </Link>
  );
}

function HighlightBadge({ highlight }) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/70">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/10 text-lg">{highlight.icon}</div>
      <div className="space-y-1">
        <p className="text-base font-semibold text-white">{highlight.title}</p>
        <p>{highlight.detail}</p>
      </div>
    </div>
  );
}

function QuickLinkCard({ item }) {
  return (
    <a
      href={item.href}
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/50 p-6 transition hover:border-white/30 hover:bg-slate-900/80"
    >
      <div className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/60">Resource</p>
        <h3 className="text-lg font-semibold text-white">{item.title}</h3>
        <p className="text-sm text-white/70">{item.description}</p>
      </div>
      <span className="mt-6 inline-flex items-center gap-2 text-xs font-semibold text-sky-400 transition group-hover:translate-x-1 group-hover:text-sky-200">
        View details
        <span aria-hidden="true">→</span>
      </span>
    </a>
  );
}

function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.12),_transparent_60%)]" />
      <div className="pointer-events-none absolute inset-y-0 right-0 -z-10 w-[40rem] max-w-full translate-x-1/3 bg-[conic-gradient(from_140deg_at_50%_50%,_rgba(59,130,246,0.18),_transparent_60%)] blur-3xl" />

      <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur"> 
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 py-16 lg:flex-row lg:items-end lg:justify-between lg:py-20">
          <div className="max-w-2xl space-y-6">
            <p className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-sky-300">
              Dedalus Labs
            </p>
            <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
              Immersive anatomy training, powered by conversational AI
            </h1>
            <p className="text-base text-white/70 sm:text-lg">
              Explore premium medical models alongside the Gemini teaching assistant. Each lab blends real-time 3D interaction with contextual guidance designed for classrooms, clinical upskilling, and self-study.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/heart"
                className="inline-flex items-center justify-center rounded-full bg-sky-500 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
              >
                Launch heart lab
              </Link>
              <Link
                to="/brain"
                className="inline-flex items-center justify-center rounded-full border border-white/30 px-5 py-2 text-sm font-semibold text-white transition hover:border-white/60 hover:text-sky-200"
              >
                Browse labs
              </Link>
            </div>
          </div>
          <div className="grid w-full max-w-md gap-4 self-stretch text-sm text-white/70">
            {highlights.map((highlight) => (
              <HighlightBadge key={highlight.title} highlight={highlight} />
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-20 px-6 py-14">
        <section className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/50">Labs</p>
              <h2 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">Choose your anatomy experience</h2>
              <p className="mt-3 max-w-2xl text-sm text-white/70">
                Each lab includes intuitive camera controls, labeled structures, scene presets, and a persistent Gemini assistant panel for interactive explanations.
              </p>
            </div>
            <div className="flex gap-6 text-xs text-white/60">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-white">120+</p>
                <p>Identifiable structures</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-white">3</p>
                <p>Interactive models</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-white">24/7</p>
                <p>Assistant availability</p>
              </div>
            </div>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {experiences.map((experience) => (
              <ExperienceCard key={experience.name} experience={experience} />
            ))}
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/50">Why educators choose Dedalus</p>
            <h2 className="text-3xl font-semibold text-white">Designed for real classrooms and clinics</h2>
            <p className="text-sm leading-relaxed text-white/70">
              Our experiences are crafted with guidance from medical illustrators, physicians, and faculty. Host live walkthroughs, assign asynchronous practice, or let learners explore independently with dynamic prompts.
            </p>
            <ul className="space-y-3 text-sm text-white/70">
              <li>• Stable, performant rendering on laptops, tablets, and VR streaming setups.</li>
              <li>• Conversation history syncs with instructors for review and assessment.</li>
              <li>• Frequent content drops keep anatomy references aligned with curricula.</li>
            </ul>
          </div>

          <div className="grid gap-4">
            {quickLinks.map((item) => (
              <QuickLinkCard key={item.title} item={item} />
            ))}
          </div>
        </section>
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
