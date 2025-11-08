import { useMemo, useState } from 'react';

const models = [
  {
    id: 'skeletal',
    name: 'Skeletal Model',
    description:
      'Explore the human skeletal system and learn about individual bones, joints, and how they work together to provide structure and movement.',
    sampleQuestions: [
      'Which bones form the axial skeleton?',
      'How does the femur connect to the hip?',
      'What are the key features of cervical vertebrae?'
    ]
  },
  {
    id: 'muscular',
    name: 'Muscular Model',
    description:
      'Understand muscle groups, their functions, and how they interact to create movement and maintain posture.',
    sampleQuestions: [
      'What muscles are responsible for elbow flexion?',
      'Explain the difference between slow-twitch and fast-twitch fibers.',
      'How do antagonistic muscle pairs work?'
    ]
  },
  {
    id: 'circulatory',
    name: 'Circulatory Model',
    description:
      'Follow the flow of blood throughout the body and discover how the heart, vessels, and lymphatic system keep us healthy.',
    sampleQuestions: [
      'Trace the path of blood from the right atrium to the lungs.',
      'What differentiates arteries from veins?',
      'How does the lymphatic system support circulation?'
    ]
  }
];

const tabButtonClasses = (isActive) =>
  [
    'rounded-2xl border px-5 py-3 text-left text-base font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-sky-300/60',
    isActive
      ? 'border-sky-300 bg-gradient-to-br from-sky-400/35 to-sky-500/60 text-slate-900 shadow-buttonActive'
      : 'border-slate-300/60 bg-white/75 text-slate-900 shadow-button hover:border-slate-300/70 hover:bg-white'
  ].join(' ');

const messageClasses = (role) =>
  [
    'max-w-[85%] rounded-2xl px-4 py-3 text-sm text-slate-900 shadow-chat',
    role === 'user'
      ? 'self-end bg-gradient-to-br from-blue-500/25 to-blue-600/45'
      : 'self-start bg-gradient-to-br from-emerald-500/25 to-emerald-600/45'
  ].join(' ');

function App() {
  const [activeModelId, setActiveModelId] = useState(models[0].id);
  const [pendingQuestion, setPendingQuestion] = useState('');
  const [chatHistories, setChatHistories] = useState(() => {
    const initialState = {};
    models.forEach((model) => {
      initialState[model.id] = [];
    });
    return initialState;
  });

  const activeModel = useMemo(
    () => models.find((model) => model.id === activeModelId) ?? models[0],
    [activeModelId]
  );

  const activeChatHistory = chatHistories[activeModel.id] ?? [];

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmedQuestion = pendingQuestion.trim();
    if (!trimmedQuestion) return;

    const placeholderAnswer = `I'm your ${activeModel.name} assistant. Detailed answers will be available soon.`;

    setChatHistories((previous) => ({
      ...previous,
      [activeModel.id]: [
        ...activeChatHistory,
        { role: 'user', text: trimmedQuestion },
        { role: 'assistant', text: placeholderAnswer }
      ]
    }));

    setPendingQuestion('');
  };

  return (
    <main className="px-6 pb-12 pt-8 font-sans md:px-8">
      <div className="mx-auto grid max-w-5xl gap-8">
        <nav className="sticky top-4 z-20 flex items-center justify-between rounded-2xl border border-slate-300/20 bg-white/90 px-6 py-4 shadow-float backdrop-blur-xl">
          <div className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-slate-900">
            <span aria-hidden="true" className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-sky-400/20 to-blue-500/50 text-xl text-slate-900 shadow-badge">
              🩻
            </span>
            <span>Anatomy View</span>
          </div>
          <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
            <span className="cursor-pointer transition hover:text-slate-500">Guides</span>
            <span className="cursor-pointer transition hover:text-slate-500">Resources</span>
            <button
              type="button"
              className="rounded-xl border border-slate-300/20 bg-white/75 px-4 py-2 text-sm font-medium text-slate-900 shadow-button transition hover:border-slate-300/40 hover:bg-white focus:outline-none focus:ring-2 focus:ring-sky-300/60"
            >
              Contact
            </button>
          </div>
        </nav>

        <header className="mt-4 text-center">
          <h1 className="text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">Anatomy Model Explorer</h1>
          <p className="mx-auto mt-3 max-w-2xl text-base font-normal text-slate-600 md:text-lg">
            Switch between anatomical models and ask questions through each model&apos;s dedicated assistant.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(220px,280px)_1fr] lg:items-start">
          <aside className="sticky top-24 z-10 flex flex-col gap-2.5 self-start rounded-2xl border border-slate-300/20 bg-white/90 p-5 shadow-panel backdrop-blur-xl">
            {models.map((model) => (
              <button
                key={model.id}
                type="button"
                onClick={() => setActiveModelId(model.id)}
                className={tabButtonClasses(model.id === activeModelId)}
              >
                {model.name}
              </button>
            ))}
          </aside>

          <div className="grid gap-6">
            <section className="rounded-2xl border border-slate-300/25 bg-white/80 p-7 shadow-panel backdrop-blur-lg">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">{activeModel.name}</h2>
              <p className="mb-6 leading-relaxed text-slate-600">{activeModel.description}</p>

              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-sky-500">Try asking:</h3>
              <ul className="list-disc space-y-2 pl-5 text-slate-700">
                {activeModel.sampleQuestions.map((question) => (
                  <li key={question}>{question}</li>
                ))}
              </ul>
            </section>

            <section className="rounded-2xl border border-slate-300/25 bg-white/80 p-7 shadow-panel backdrop-blur-lg">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">{activeModel.name} Assistant</h2>
              <div className="flex max-h-[340px] flex-col gap-4 overflow-y-auto pr-1">
                {activeChatHistory.length === 0 ? (
                  <div className="text-center text-sm text-slate-500">
                    Start the conversation by asking a question about the {activeModel.name.toLowerCase()}.
                  </div>
                ) : (
                  activeChatHistory.map((message, index) => (
                    <div key={`${message.role}-${index}`} className={messageClasses(message.role)}>
                      <strong className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-900">
                        {message.role === 'user' ? 'You' : 'Assistant'}
                      </strong>
                      <span>{message.text}</span>
                    </div>
                  ))
                )}
              </div>

              <form className="mt-7 flex flex-wrap items-center gap-3" onSubmit={handleSubmit}>
                <input
                  className="min-w-[220px] flex-1 rounded-xl border border-slate-300/30 bg-white/90 px-4 py-3 text-sm text-slate-900 shadow-inner focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-300/40"
                  type="text"
                  value={pendingQuestion}
                  onChange={(event) => setPendingQuestion(event.target.value)}
                  placeholder={`Ask the ${activeModel.name.toLowerCase()} assistant...`}
                />
                <button
                  className="rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 px-6 py-3 text-sm font-semibold text-slate-50 shadow-submit transition hover:from-sky-500 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-sky-300/70"
                  type="submit"
                >
                  Ask
                </button>
              </form>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

export default App;
