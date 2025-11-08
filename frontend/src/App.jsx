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

const styles = {
  page: {
    fontFamily: '"Inter", system-ui, sans-serif',
    background: 'linear-gradient(180deg, #0f172a 0%, #111827 100%)',
    color: '#e5e7eb',
    minHeight: '100vh',
    margin: 0,
    padding: '2.5rem 1.5rem'
  },
  appContainer: {
    maxWidth: '1100px',
    margin: '0 auto',
    display: 'grid',
    gap: '2rem'
  },
  header: {
    textAlign: 'center'
  },
  headline: {
    fontSize: '2.5rem',
    marginBottom: '0.5rem',
    color: '#f8fafc'
  },
  subheadline: {
    color: '#94a3b8',
    fontSize: '1.05rem'
  },
  tabs: {
    display: 'flex',
    gap: '0.75rem',
    flexWrap: 'wrap',
    justifyContent: 'center'
  },
  tabButton: (isActive) => ({
    border: '1px solid',
    borderColor: isActive ? '#38bdf8' : '#1f2937',
    background: isActive
      ? 'linear-gradient(135deg, rgba(56,189,248,0.2), rgba(14,165,233,0.35))'
      : 'rgba(15, 23, 42, 0.75)',
    color: '#f8fafc',
    padding: '0.75rem 1.5rem',
    borderRadius: '999px',
    cursor: 'pointer',
    fontSize: '0.95rem',
    transition: 'all 0.2s ease-in-out'
  }),
  contentGrid: {
    display: 'grid',
    gap: '1.5rem',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))'
  },
  panel: {
    background: 'rgba(15, 23, 42, 0.6)',
    border: '1px solid rgba(148, 163, 184, 0.15)',
    borderRadius: '1.25rem',
    padding: '1.75rem',
    boxShadow: '0 16px 48px rgba(15, 23, 42, 0.45)'
  },
  panelHeading: {
    fontSize: '1.35rem',
    fontWeight: 600,
    marginBottom: '1rem',
    color: '#e0f2fe'
  },
  description: {
    lineHeight: 1.6,
    color: '#cbd5f5',
    marginBottom: '1.5rem'
  },
  sampleList: {
    listStyle: 'disc',
    paddingLeft: '1.25rem',
    color: '#e5e7eb',
    lineHeight: 1.5
  },
  chatHistory: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    maxHeight: '340px',
    overflowY: 'auto',
    paddingRight: '0.25rem'
  },
  message: (role) => ({
    alignSelf: role === 'user' ? 'flex-end' : 'flex-start',
    background:
      role === 'user'
        ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.25), rgba(37, 99, 235, 0.55))'
        : 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(5, 150, 105, 0.55))',
    padding: '0.9rem 1.1rem',
    borderRadius: '1rem',
    color: '#f8fafc',
    maxWidth: '85%',
    boxShadow: '0 8px 28px rgba(15, 23, 42, 0.35)'
  }),
  chatForm: {
    marginTop: '1.75rem',
    display: 'flex',
    gap: '0.75rem',
    flexWrap: 'wrap'
  },
  input: {
    flex: 1,
    minWidth: '220px',
    padding: '0.85rem 1rem',
    borderRadius: '0.9rem',
    border: '1px solid rgba(148, 163, 184, 0.3)',
    background: 'rgba(15, 23, 42, 0.85)',
    color: '#f8fafc',
    fontSize: '0.95rem'
  },
  submitButton: {
    padding: '0.85rem 1.5rem',
    borderRadius: '0.9rem',
    border: 'none',
    background: 'linear-gradient(135deg, #38bdf8, #2563eb)',
    color: '#0f172a',
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 8px 20px rgba(37, 99, 235, 0.35)'
  },
  emptyState: {
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: '0.95rem'
  }
};

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
    <main style={styles.page}>
      <div style={styles.appContainer}>
        <header style={styles.header}>
          <h1 style={styles.headline}>Anatomy Model Explorer</h1>
          <p style={styles.subheadline}>
            Switch between anatomical models and ask questions through each model&apos;s dedicated
            assistant.
          </p>
        </header>

        <nav style={styles.tabs}>
          {models.map((model) => (
            <button
              key={model.id}
              type="button"
              onClick={() => setActiveModelId(model.id)}
              style={styles.tabButton(model.id === activeModelId)}
            >
              {model.name}
            </button>
          ))}
        </nav>

        <div style={styles.contentGrid}>
          <section style={styles.panel}>
            <h2 style={styles.panelHeading}>{activeModel.name}</h2>
            <p style={styles.description}>{activeModel.description}</p>

            <h3 style={{ fontSize: '1.05rem', marginBottom: '0.75rem', color: '#bae6fd' }}>
              Try asking:
            </h3>
            <ul style={styles.sampleList}>
              {activeModel.sampleQuestions.map((question) => (
                <li key={question}>{question}</li>
              ))}
            </ul>
          </section>

          <section style={styles.panel}>
            <h2 style={styles.panelHeading}>{activeModel.name} Assistant</h2>
            <div style={styles.chatHistory}>
              {activeChatHistory.length === 0 ? (
                <div style={styles.emptyState}>
                  Start the conversation by asking a question about the {activeModel.name.toLowerCase()}.
                </div>
              ) : (
                activeChatHistory.map((message, index) => (
                  <div key={`${message.role}-${index}`} style={styles.message(message.role)}>
                    <strong style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.8rem' }}>
                      {message.role === 'user' ? 'You' : 'Assistant'}
                    </strong>
                    <span>{message.text}</span>
                  </div>
                ))
              )}
            </div>

            <form style={styles.chatForm} onSubmit={handleSubmit}>
              <input
                style={styles.input}
                type="text"
                value={pendingQuestion}
                onChange={(event) => setPendingQuestion(event.target.value)}
                placeholder={`Ask the ${activeModel.name.toLowerCase()} assistant...`}
              />
              <button style={styles.submitButton} type="submit">
                Ask
              </button>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}

export default App;
